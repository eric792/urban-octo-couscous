import { Prisma } from "@prisma/client";
import { revalidateTag } from "next/cache";
import { db } from "@/lib/db";
import { sendOrderConfirmation } from "@/lib/email";
import { captureAlert, logger, metrics } from "@/lib/monitoring";
import { toCents } from "@/lib/utils";

function stamp(note: string): string {
  return `[${new Date().toISOString()}] ${note}`;
}

export async function appendOrderNote(orderId: string, note: string) {
  const order = await db.order.findUnique({ where: { id: orderId }, select: { notes: true } });
  if (!order) return;
  await db.order.update({
    where: { id: orderId },
    data: { notes: [order.notes, stamp(note)].filter(Boolean).join("\n") },
  });
}

export type MarkPaidResult =
  | { updated: true }
  | { updated: false; reason: "not_found" | "already_processed" | "amount_mismatch" | "duplicate_payment" };

/** Transactions touching stock must finish quickly or roll back. */
const TX_OPTIONS = { maxWait: 5_000, timeout: 10_000 };

async function flagDuplicatePayment(
  order: { id: string; orderNumber: string; gateway: string; gatewayTxId: string | null },
  incomingTxId: string,
  source: string,
) {
  captureAlert("Duplicate payment received — refund required", {
    area: "orders",
    gateway: order.gateway,
    orderId: order.id,
    orderNumber: order.orderNumber,
    extra: { existingTxId: order.gatewayTxId, duplicateTxId: incomingTxId, source },
  });
  metrics.count("payment.duplicate", 1, { attributes: { gateway: order.gateway } });
  await appendOrderNote(
    order.id,
    `DUPLICATE PAYMENT: ${source} reported a second payment (ref ${incomingTxId}) for an order already paid${order.gatewayTxId ? ` with ref ${order.gatewayTxId}` : ""}. Stock was not deducted again — refund the duplicate in the ${order.gateway} dashboard.`,
  );
}

/**
 * Marks an order as paid exactly once: moves it to NEW, deducts stock and
 * counts the discount redemption. Safe to call repeatedly (webhooks retry).
 */
export async function markOrderPaid(
  orderId: string,
  opts: { gatewayTxId?: string | null; amountCents?: number; source: string },
): Promise<MarkPaidResult> {
  const order = await db.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!order) return { updated: false, reason: "not_found" };

  if (opts.amountCents !== undefined && opts.amountCents !== toCents(order.totalAmount)) {
    captureAlert("Payment amount does not match order total", {
      area: "orders",
      gateway: order.gateway,
      orderId,
      orderNumber: order.orderNumber,
      extra: { paidCents: opts.amountCents, expectedCents: toCents(order.totalAmount), source: opts.source },
    });
    await appendOrderNote(
      orderId,
      `${opts.source}: payment amount ${opts.amountCents / 100} does not match order total ${order.totalAmount.toString()}. Not marked as paid — please check the gateway dashboard.`,
    );
    return { updated: false, reason: "amount_mismatch" };
  }

  let updated: boolean;
  try {
    updated = await db.$transaction(async (tx) => {
      const res = await tx.order.updateMany({
        where: { id: orderId, paidAt: null, status: { in: ["PENDING_PAYMENT", "CANCELLED"] } },
        data: {
          status: "NEW",
          paidAt: new Date(),
          gatewayTxId: opts.gatewayTxId ?? undefined,
        },
      });
      if (res.count === 0) return false;

      for (const item of order.items) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { decrement: item.quantity } },
        });
      }
      if (order.discountCode) {
        await tx.discountCode.updateMany({
          where: { code: order.discountCode },
          data: { usedCount: { increment: 1 } },
        });
      }
      return true;
    }, TX_OPTIONS);
  } catch (err) {
    // The gateway reference is already attached to a different order.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002" && opts.gatewayTxId) {
      await flagDuplicatePayment(order, opts.gatewayTxId, opts.source);
      return { updated: false, reason: "duplicate_payment" };
    }
    throw err;
  }

  if (!updated) {
    // Webhook retries carry the same reference; a different one is a second payment.
    const current = await db.order.findUnique({ where: { id: orderId }, select: { paidAt: true, gatewayTxId: true } });
    if (current?.paidAt && opts.gatewayTxId) {
      if (!current.gatewayTxId) {
        // Paid manually first (e.g. admin confirmation) — just record the gateway reference.
        await db.order.update({ where: { id: orderId }, data: { gatewayTxId: opts.gatewayTxId } }).catch(() => undefined);
      } else if (current.gatewayTxId !== opts.gatewayTxId) {
        await flagDuplicatePayment({ ...order, gatewayTxId: current.gatewayTxId }, opts.gatewayTxId, opts.source);
        return { updated: false, reason: "duplicate_payment" };
      }
    }
    return { updated: false, reason: "already_processed" };
  }

  await appendOrderNote(orderId, `${opts.source}: payment confirmed${opts.gatewayTxId ? ` (ref ${opts.gatewayTxId})` : ""}.`);
  revalidateTag("catalog"); // stock levels changed
  logger.info("Order paid", { orderNumber: order.orderNumber, gateway: order.gateway, total: Number(order.totalAmount), source: opts.source });
  metrics.count("order.paid", 1, { attributes: { gateway: order.gateway } });
  metrics.distribution("order.value", Number(order.totalAmount), { attributes: { gateway: order.gateway } });

  const paid = await db.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (paid) await sendOrderConfirmation(paid);
  return { updated: true };
}

/** Cancels an order that was never paid (failed / cancelled at the gateway). */
export async function markPaymentFailed(orderId: string, source: string, reason: string) {
  const res = await db.order.updateMany({
    where: { id: orderId, status: "PENDING_PAYMENT", paidAt: null },
    data: { status: "CANCELLED" },
  });
  if (res.count > 0) {
    await appendOrderNote(orderId, `${source}: ${reason}`);
    logger.info("Order payment failed or cancelled", { orderId, source, reason });
    metrics.count("order.payment_failed", 1, { attributes: { source } });
  }
}
