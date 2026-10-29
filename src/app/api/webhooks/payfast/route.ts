import { withApi } from "@/lib/api";
import { db } from "@/lib/db";
import { captureAlert } from "@/lib/monitoring";
import { appendOrderNote, markOrderPaid, markPaymentFailed } from "@/lib/orders";
import { verifyPayfastItn } from "@/lib/payments/payfast";
import { toCents } from "@/lib/utils";

/**
 * Payfast ITN (notify_url). Payfast posts form data here after every payment.
 * We verify signature, (optionally) source IP, server confirmation and amount
 * before marking the order paid.
 */
export const maxDuration = 30;

// Internal errors return 5xx so Payfast retries the notification.
export const POST = withApi({ name: "webhook.payfast", rateLimit: ["webhook"], maxBodyBytes: 65_536 }, async (req, ctx) => {
  const raw = ctx.body;
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip");

  const check = await verifyPayfastItn(raw, ip);
  if (!check.valid) {
    captureAlert(`Payfast ITN rejected: ${check.reason.split(":")[0]}`, {
      area: "payfast",
      gateway: "PAYFAST",
      orderId: check.data?.m_payment_id,
      extra: { reason: check.reason, paymentStatus: check.data?.payment_status },
    }, check.retryable ? "error" : "warning");
    // A check we couldn't complete (Payfast unreachable) is retried; a forged one isn't.
    return new Response(check.retryable ? "Temporarily unable to verify" : "Invalid ITN", { status: check.retryable ? 503 : 400 });
  }

  const { data } = check;
  const order = data.m_payment_id
    ? await db.order.findUnique({ where: { id: data.m_payment_id }, select: { id: true } })
    : null;
  if (!order) {
    captureAlert("Payfast ITN for an unknown order", { area: "payfast", gateway: "PAYFAST", orderId: data.m_payment_id }, "warning");
    return new Response("OK");
  }

  const status = (data.payment_status || "").toUpperCase();
  if (status === "COMPLETE") {
    const result = await markOrderPaid(order.id, {
      gatewayTxId: data.pf_payment_id,
      amountCents: toCents(data.amount_gross),
      source: "Payfast",
    });
    // amount_mismatch and duplicate_payment are recorded and alerted inside markOrderPaid.
    void result;
  } else if (status === "CANCELLED" || status === "FAILED") {
    await markPaymentFailed(order.id, "Payfast", `Payment ${status.toLowerCase()} (pf ${data.pf_payment_id ?? "?"}).`);
  } else {
    await appendOrderNote(order.id, `Payfast: status ${status || "unknown"} received.`);
  }

  return new Response("OK");
});
