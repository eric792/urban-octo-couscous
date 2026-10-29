import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { appendOrderNote, markOrderPaid, markPaymentFailed } from "@/lib/orders";
import { verifyYocoWebhook, type YocoWebhookEvent } from "@/lib/payments/yoco";

/**
 * Yoco webhook — register with `npm run yoco:webhook`.
 * Marks orders paid on "payment.succeeded" after verifying the signature
 * and that the amount matches the order total.
 */
export async function POST(req: Request) {
  const raw = await req.text();
  if (!verifyYocoWebhook(raw, req.headers)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: YocoWebhookEvent;
  try {
    event = JSON.parse(raw) as YocoWebhookEvent;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const meta = event.payload?.metadata ?? {};
  const order = await db.order.findFirst({
    where: {
      OR: [
        ...(meta.checkoutId ? [{ gatewayRef: meta.checkoutId }] : []),
        ...(meta.orderId ? [{ id: meta.orderId }] : []),
      ],
    },
    select: { id: true },
  });

  if (!order) {
    // Acknowledge so Yoco stops retrying; nothing we can match.
    console.warn(`[yoco] no order for event ${event.id} (checkout ${meta.checkoutId ?? "?"})`);
    return NextResponse.json({ received: true });
  }

  switch (event.type) {
    case "payment.succeeded": {
      const result = await markOrderPaid(order.id, {
        gatewayTxId: event.payload.id,
        amountCents: event.payload.amount,
        source: "Yoco",
      });
      if (!result.updated && result.reason === "amount_mismatch") {
        console.error(`[yoco] amount mismatch on order ${order.id}`);
      }
      break;
    }
    case "payment.failed":
      await markPaymentFailed(order.id, "Yoco", "Payment failed at Yoco.");
      break;
    case "refund.succeeded":
      await db.order.update({ where: { id: order.id }, data: { status: "REFUNDED" } });
      await appendOrderNote(order.id, "Yoco: refund succeeded.");
      break;
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
