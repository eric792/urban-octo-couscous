import type { Order } from "@prisma/client";
import { NextResponse } from "next/server";
import { ApiError, withApi, type ApiContext } from "@/lib/api";
import {
  availableGateways,
  createPendingOrder,
  DuplicateAttemptError,
  findRecentPendingOrder,
  requestFingerprint,
} from "@/lib/checkout";
import { db } from "@/lib/db";
import { TimeoutError } from "@/lib/http";
import { captureError, logger, metrics } from "@/lib/monitoring";
import { appendOrderNote } from "@/lib/orders";
import { buildPayfastCheckout } from "@/lib/payments/payfast";
import { createYocoCheckout } from "@/lib/payments/yoco";
import { buildQuote } from "@/lib/pricing";
import { getSettings } from "@/lib/settings";
import { absoluteUrl, toCents } from "@/lib/utils";
import { checkoutSchema, type CheckoutInput } from "@/lib/validation";

export const maxDuration = 30;

const KEY_PATTERN = /^[A-Za-z0-9_-]{16,64}$/;

/**
 * POST /api/checkout
 *
 * Validates the order, re-prices it from the database, stores it as
 * PENDING_PAYMENT and returns where the shopper should pay.
 *
 * Duplicate-payment protection:
 * - `Idempotency-Key` header: retrying the same attempt (double click, timeout,
 *   refresh) resumes the same order and the same hosted payment page.
 * - The same purchase from another tab within 15 minutes reuses the unpaid order.
 * - An order that's already paid is never sent to a gateway again.
 */
export const POST = withApi(
  { name: "checkout", rateLimit: ["checkout", "checkoutHourly"], maxBodyBytes: 16_384, timeoutMs: 28_000 },
  async (req, ctx) => {
    const idempotencyKey = req.headers.get("idempotency-key");
    if (idempotencyKey && !KEY_PATTERN.test(idempotencyKey)) {
      throw new ApiError(400, "BAD_REQUEST", "Invalid Idempotency-Key header.");
    }

    const input = checkoutSchema.parse(ctx.json());
    const settings = await getSettings();
    if (!availableGateways(settings).includes(input.gateway)) {
      throw new ApiError(400, "BAD_REQUEST", "That payment method isn't available right now.");
    }
    const requestHash = requestFingerprint(input);

    // 1. The same attempt retried.
    if (idempotencyKey) {
      const existing = await db.order.findUnique({ where: { idempotencyKey } });
      if (existing) return resume(existing, input, requestHash, ctx);
    }

    const quote = await buildQuote(input, settings);
    if (quote.issues.length) throw new ApiError(409, "CONFLICT", quote.issues.join(" "));
    if (quote.total <= 0) throw new ApiError(400, "BAD_REQUEST", "Your order total must be more than R0.");

    // 2. The same purchase submitted again from another tab.
    const recent = await findRecentPendingOrder(input.customer.email, requestHash);
    if (recent && toCents(recent.totalAmount) === toCents(quote.total)) {
      logger.info("Checkout reused pending order", { orderNumber: recent.orderNumber, gateway: recent.gateway });
      metrics.count("checkout.deduplicated", 1, { attributes: { reason: "recent_pending" } });
      return startPayment(recent, input, ctx);
    }

    let order: Order;
    try {
      order = await createPendingOrder(input, quote, { idempotencyKey, requestHash });
    } catch (err) {
      // 3. Two identical requests raced; the other one created the order.
      if (err instanceof DuplicateAttemptError && idempotencyKey) {
        const existing = await db.order.findUnique({ where: { idempotencyKey } });
        if (existing) return resume(existing, input, requestHash, ctx);
      }
      throw err;
    }

    logger.info("Checkout started", {
      orderNumber: order.orderNumber,
      gateway: input.gateway,
      deliveryMethod: input.deliveryMethod,
      total: quote.total,
      discountCode: quote.discountCode ?? "none",
    });
    metrics.count("checkout.started", 1, { attributes: { gateway: input.gateway } });

    if (input.marketingOptIn) {
      await db.subscriber
        .upsert({ where: { email: order.customerEmail }, update: {}, create: { email: order.customerEmail, source: "checkout" } })
        .catch(() => undefined);
    }

    return startPayment(order, input, ctx);
  },
);

function successUrl(order: Order) {
  return absoluteUrl(`/checkout/success?ref=${order.id}`);
}

/** Continue an attempt we've already seen, without ever charging twice. */
async function resume(order: Order, input: CheckoutInput, requestHash: string, ctx: ApiContext) {
  metrics.count("checkout.deduplicated", 1, { attributes: { reason: "idempotency_key" } });

  if (order.requestHash !== requestHash) {
    throw new ApiError(409, "CONFLICT", "Your bag changed since this attempt. Please try again.", { retryWithNewKey: true });
  }
  if (order.paidAt) {
    return NextResponse.json({ ok: true, type: "redirect", url: successUrl(order), orderNumber: order.orderNumber, alreadyPaid: true });
  }
  if (order.status !== "PENDING_PAYMENT") {
    throw new ApiError(409, "CONFLICT", "That checkout attempt has closed. Please try again.", { retryWithNewKey: true });
  }
  return startPayment(order, input, ctx);
}

async function startPayment(order: Order, input: CheckoutInput, ctx: ApiContext) {
  const success = successUrl(order);
  const cancelUrl = absoluteUrl(`/checkout/cancelled?ref=${order.id}`);

  try {
    if (order.gateway === "YOCO") {
      // One hosted checkout per order: reuse it if we already have one.
      if (order.gatewayRef && order.gatewayRedirectUrl) {
        return NextResponse.json({ ok: true, type: "redirect", url: order.gatewayRedirectUrl, orderNumber: order.orderNumber });
      }
      const checkout = await createYocoCheckout({
        amountCents: toCents(order.totalAmount),
        orderId: order.id,
        orderNumber: order.orderNumber,
        successUrl: success,
        cancelUrl,
        failureUrl: `${cancelUrl}&failed=1`,
      });
      await db.order.update({
        where: { id: order.id },
        data: { gatewayRef: checkout.id, gatewayRedirectUrl: checkout.redirectUrl },
      });
      return NextResponse.json({ ok: true, type: "redirect", url: checkout.redirectUrl, orderNumber: order.orderNumber });
    }

    if (order.gateway === "PAYFAST") {
      const { action, fields } = buildPayfastCheckout({
        orderId: order.id,
        orderNumber: order.orderNumber,
        amount: Number(order.totalAmount),
        firstName: input.customer.firstName,
        lastName: input.customer.lastName,
        email: order.customerEmail,
        phone: order.customerPhone ?? undefined,
        returnUrl: success,
        cancelUrl,
        notifyUrl: absoluteUrl("/api/webhooks/payfast"),
      });
      return NextResponse.json({ ok: true, type: "payfast", action, fields, orderNumber: order.orderNumber });
    }

    // Manual EFT: the order waits until the owner confirms the transfer in Admin.
    return NextResponse.json({ ok: true, type: "redirect", url: success, orderNumber: order.orderNumber });
  } catch (err) {
    // The order stays PENDING_PAYMENT so a retry with the same key resumes it
    // (Yoco also de-duplicates on the order id, so no second checkout is created).
    captureError(err, { area: "checkout", gateway: order.gateway, orderId: order.id, orderNumber: order.orderNumber, extra: { requestId: ctx.requestId } });
    metrics.count("checkout.payment_init_failed", 1, { attributes: { gateway: order.gateway } });
    await appendOrderNote(order.id, `Could not start ${order.gateway} payment: ${(err as Error).message}`);
    if (err instanceof TimeoutError) {
      throw new ApiError(504, "TIMEOUT", "The payment provider is slow to respond. Please try again — you won't be charged twice.", { retryable: true });
    }
    throw new ApiError(502, "UPSTREAM_UNAVAILABLE", "We couldn't connect to the payment provider. Please try again or choose another method.", { retryable: true });
  }
}
