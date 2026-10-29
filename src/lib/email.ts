import type { Order, OrderItem } from "@prisma/client";
import { DELIVERY_OPTIONS, STORE_NAME } from "@/lib/constants";
import { fetchWithTimeout, TIMEOUTS } from "@/lib/http";
import { captureError } from "@/lib/monitoring";
import { absoluteUrl, formatZAR } from "@/lib/utils";

/*
 * Transactional email via Resend's HTTP API (no SDK needed).
 * Set RESEND_API_KEY and EMAIL_FROM to enable. Without them, emails are
 * logged to the server console so nothing breaks in development.
 */

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

async function sendEmail(to: string, subject: string, html: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) {
    console.info(`[email:disabled] to=${to} subject="${subject}"`);
    return;
  }
  try {
    const res = await fetchWithTimeout("Resend", "https://api.resend.com/emails", {
      timeoutMs: TIMEOUTS.resend,
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to, subject, html }),
    });
    if (!res.ok) captureError(new Error(`Resend responded ${res.status}`), { area: "email", extra: { subject } });
  } catch (err) {
    captureError(err, { area: "email", extra: { subject } });
  }
}

function layout(title: string, body: string): string {
  return `<!doctype html><html><body style="margin:0;background:#0a0a0b;font-family:Helvetica,Arial,sans-serif;color:#e4e4e7">
  <div style="max-width:560px;margin:0 auto;padding:40px 24px">
    <p style="font-family:Georgia,serif;font-size:22px;letter-spacing:6px;color:#d6b46c;margin:0 0 32px">ZEN AMOUR</p>
    <h1 style="font-family:Georgia,serif;font-weight:normal;font-size:28px;color:#ffffff;margin:0 0 16px">${title}</h1>
    ${body}
    <p style="margin-top:40px;font-size:12px;color:#71717a">${STORE_NAME} · Affordable luxury, crafted in South Africa</p>
  </div></body></html>`;
}

type OrderWithItems = Order & { items: OrderItem[] };

function itemsTable(order: OrderWithItems): string {
  const rows = order.items
    .map(
      (i) => `<tr><td style="padding:8px 0;color:#e4e4e7">${escapeHtml(i.productName)}${i.variantLabel ? ` · ${escapeHtml(i.variantLabel)}` : ""} × ${i.quantity}</td>
      <td style="padding:8px 0;text-align:right;color:#e4e4e7">${formatZAR(Number(i.price) * i.quantity)}</td></tr>`,
    )
    .join("");
  return `<table style="width:100%;border-collapse:collapse;border-top:1px solid #2a2a30;border-bottom:1px solid #2a2a30;margin:24px 0">${rows}
    <tr><td style="padding:8px 0;color:#a1a1aa">Delivery</td><td style="text-align:right;color:#a1a1aa">${formatZAR(order.shippingCost)}</td></tr>
    ${Number(order.discountAmount) > 0 ? `<tr><td style="padding:8px 0;color:#a1a1aa">Discount</td><td style="text-align:right;color:#a1a1aa">−${formatZAR(order.discountAmount)}</td></tr>` : ""}
    <tr><td style="padding:12px 0;color:#ffffff;font-weight:bold">Total</td><td style="text-align:right;color:#d6b46c;font-weight:bold">${formatZAR(order.totalAmount)}</td></tr></table>`;
}

export async function sendOrderConfirmation(order: OrderWithItems) {
  const delivery =
    order.deliveryMethod === "PARGO_PICKUP_POINT" && order.pargoPointName
      ? `Collect from <strong>${escapeHtml(order.pargoPointName)}</strong> (Pargo). We'll SMS & email you when it's ready.`
      : `${DELIVERY_OPTIONS[order.deliveryMethod].label} — ${DELIVERY_OPTIONS[order.deliveryMethod].eta}.`;
  await sendEmail(
    order.customerEmail,
    `Your Zen Amour order ${order.orderNumber} is confirmed`,
    layout(
      `Thank you, ${escapeHtml(order.customerName.split(" ")[0])}.`,
      `<p style="color:#a1a1aa;line-height:1.6">We've received your payment for order <strong style="color:#fff">${order.orderNumber}</strong> and are preparing it with care.</p>
       ${itemsTable(order)}
       <p style="color:#a1a1aa;line-height:1.6">${delivery}</p>
       <p><a href="${absoluteUrl("/track-order")}" style="color:#d6b46c">Track your order</a></p>`,
    ),
  );

  const alertTo = process.env.ORDER_ALERT_EMAIL;
  if (alertTo) {
    await sendEmail(
      alertTo,
      `New order ${order.orderNumber} — ${formatZAR(order.totalAmount)}`,
      layout("New paid order", `<p style="color:#a1a1aa">${escapeHtml(order.customerName)} (${escapeHtml(order.customerEmail)})</p>${itemsTable(order)}<p><a href="${absoluteUrl(`/admin/orders/${order.id}`)}" style="color:#d6b46c">Open in admin</a></p>`),
    );
  }
}

export async function sendShippingUpdate(order: Order) {
  const code = order.pargoWaybillCode || order.trackingNumber;
  await sendEmail(
    order.customerEmail,
    `Your Zen Amour order ${order.orderNumber} is on its way`,
    layout(
      "Your order has shipped",
      `<p style="color:#a1a1aa;line-height:1.6">Good news — order <strong style="color:#fff">${order.orderNumber}</strong> is on its way${order.pargoPointName ? ` to ${escapeHtml(order.pargoPointName)}` : ""}.</p>
       ${code ? `<p style="color:#a1a1aa">Tracking / waybill: <strong style="color:#d6b46c">${escapeHtml(code)}</strong></p>` : ""}
       <p><a href="${absoluteUrl("/track-order")}" style="color:#d6b46c">Track your order</a></p>`,
    ),
  );
}
