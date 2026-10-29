import { revalidateTag } from "next/cache";
import { db } from "@/lib/db";
import { sendOrderConfirmation } from "@/lib/email";
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
  | { updated: false; reason: "not_found" | "already_processed" | "amount_mismatch" };

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
    await appendOrderNote(
      orderId,
      `${opts.source}: payment amount ${opts.amountCents / 100} does not match order total ${order.totalAmount.toString()}. Not marked as paid — please check the gateway dashboard.`,
    );
    return { updated: false, reason: "amount_mismatch" };
  }

  const updated = await db.$transaction(async (tx) => {
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
  });

  if (!updated) return { updated: false, reason: "already_processed" };

  await appendOrderNote(orderId, `${opts.source}: payment confirmed${opts.gatewayTxId ? ` (ref ${opts.gatewayTxId})` : ""}.`);
  revalidateTag("catalog"); // stock levels changed

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
  if (res.count > 0) await appendOrderNote(orderId, `${source}: ${reason}`);
}
