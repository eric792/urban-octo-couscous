import { db } from "@/lib/db";
import { appendOrderNote, markOrderPaid, markPaymentFailed } from "@/lib/orders";
import { verifyPayfastItn } from "@/lib/payments/payfast";
import { toCents } from "@/lib/utils";

/**
 * Payfast ITN (notify_url). Payfast posts form data here after every payment.
 * We verify signature, (optionally) source IP, server confirmation and amount
 * before marking the order paid.
 */
export async function POST(req: Request) {
  const raw = await req.text();
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip");

  const check = await verifyPayfastItn(raw, ip);
  if (!check.valid) {
    console.warn(`[payfast] ITN rejected: ${check.reason}`);
    return new Response("Invalid ITN", { status: 400 });
  }

  const { data } = check;
  const order = data.m_payment_id
    ? await db.order.findUnique({ where: { id: data.m_payment_id }, select: { id: true } })
    : null;
  if (!order) {
    console.warn(`[payfast] ITN for unknown order ${data.m_payment_id}`);
    return new Response("OK");
  }

  const status = (data.payment_status || "").toUpperCase();
  if (status === "COMPLETE") {
    const result = await markOrderPaid(order.id, {
      gatewayTxId: data.pf_payment_id,
      amountCents: toCents(data.amount_gross),
      source: "Payfast",
    });
    if (!result.updated && result.reason === "amount_mismatch") {
      console.error(`[payfast] amount mismatch on order ${order.id}`);
    }
  } else if (status === "CANCELLED" || status === "FAILED") {
    await markPaymentFailed(order.id, "Payfast", `Payment ${status.toLowerCase()} (pf ${data.pf_payment_id ?? "?"}).`);
  } else {
    await appendOrderNote(order.id, `Payfast: status ${status || "unknown"} received.`);
  }

  return new Response("OK");
}
