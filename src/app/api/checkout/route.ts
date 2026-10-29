import { NextResponse } from "next/server";
import { availableGateways, createPendingOrder } from "@/lib/checkout";
import { db } from "@/lib/db";
import { captureError, logger, metrics } from "@/lib/monitoring";
import { markPaymentFailed } from "@/lib/orders";
import { buildPayfastCheckout } from "@/lib/payments/payfast";
import { createYocoCheckout } from "@/lib/payments/yoco";
import { buildQuote } from "@/lib/pricing";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { getSettings } from "@/lib/settings";
import { absoluteUrl, toCents } from "@/lib/utils";
import { checkoutSchema, issuesToErrors } from "@/lib/validation";

/**
 * POST /api/checkout
 * Validates the order, re-prices it from the database, stores it as
 * PENDING_PAYMENT and hands back where the shopper should go to pay.
 */
export async function POST(req: Request) {
  if (!rateLimit(`checkout:${await clientIp()}`, 10, 60_000)) {
    return NextResponse.json({ ok: false, message: "Too many attempts. Please wait a minute and try again." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, message: "Please check the highlighted fields.", errors: issuesToErrors(parsed.error.issues) },
      { status: 422 },
    );
  }
  const input = parsed.data;
  const settings = await getSettings();

  if (!availableGateways(settings).includes(input.gateway)) {
    return NextResponse.json({ ok: false, message: "That payment method isn't available right now." }, { status: 400 });
  }

  const quote = await buildQuote(input, settings);
  if (quote.issues.length) {
    return NextResponse.json({ ok: false, message: quote.issues.join(" ") }, { status: 409 });
  }
  if (quote.total <= 0) {
    return NextResponse.json({ ok: false, message: "Your order total must be more than R0." }, { status: 400 });
  }

  const order = await createPendingOrder(input, quote);
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
      .upsert({
        where: { email: order.customerEmail },
        update: {},
        create: { email: order.customerEmail, source: "checkout" },
      })
      .catch(() => undefined);
  }

  const successUrl = absoluteUrl(`/checkout/success?ref=${order.id}`);
  const cancelUrl = absoluteUrl(`/checkout/cancelled?ref=${order.id}`);

  try {
    if (input.gateway === "YOCO") {
      const checkout = await createYocoCheckout({
        amountCents: toCents(order.totalAmount),
        orderId: order.id,
        orderNumber: order.orderNumber,
        successUrl,
        cancelUrl,
        failureUrl: `${cancelUrl}&failed=1`,
      });
      await db.order.update({ where: { id: order.id }, data: { gatewayRef: checkout.id } });
      return NextResponse.json({ ok: true, type: "redirect", url: checkout.redirectUrl, orderNumber: order.orderNumber });
    }

    if (input.gateway === "PAYFAST") {
      const { action, fields } = buildPayfastCheckout({
        orderId: order.id,
        orderNumber: order.orderNumber,
        amount: Number(order.totalAmount),
        firstName: input.customer.firstName,
        lastName: input.customer.lastName,
        email: order.customerEmail,
        phone: order.customerPhone ?? undefined,
        returnUrl: successUrl,
        cancelUrl,
        notifyUrl: absoluteUrl("/api/webhooks/payfast"),
      });
      return NextResponse.json({ ok: true, type: "payfast", action, fields, orderNumber: order.orderNumber });
    }

    // Manual EFT: the order waits until the owner confirms the transfer in Admin.
    return NextResponse.json({ ok: true, type: "redirect", url: successUrl, orderNumber: order.orderNumber });
  } catch (err) {
    captureError(err, { area: "checkout", gateway: input.gateway, orderId: order.id, orderNumber: order.orderNumber });
    metrics.count("checkout.payment_init_failed", 1, { attributes: { gateway: input.gateway } });
    await markPaymentFailed(order.id, input.gateway, `Could not start payment: ${(err as Error).message}`);
    return NextResponse.json(
      { ok: false, message: "We couldn't connect to the payment provider. Please try again or choose another method." },
      { status: 502 },
    );
  }
}
