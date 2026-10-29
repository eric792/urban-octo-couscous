import crypto from "node:crypto";

// Yoco Checkout API — https://developer.yoco.com
// Amounts are integer cents in ZAR. Test vs live mode is decided by the key (sk_test_ / sk_live_).

const YOCO_API = "https://payments.yoco.com/api";

export class YocoError extends Error {}

function secretKey(): string {
  const key = process.env.YOCO_SECRET_KEY;
  if (!key) throw new YocoError("Yoco is not configured. Set YOCO_SECRET_KEY.");
  return key;
}

export interface YocoCheckout {
  id: string;
  redirectUrl: string;
  status: string;
}

export async function createYocoCheckout(params: {
  amountCents: number;
  orderId: string;
  orderNumber: string;
  successUrl: string;
  cancelUrl: string;
  failureUrl: string;
}): Promise<YocoCheckout> {
  const res = await fetch(`${YOCO_API}/checkouts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey()}`,
      "Content-Type": "application/json",
      // Retrying the same order never creates a second checkout.
      "Idempotency-Key": params.orderId,
    },
    body: JSON.stringify({
      amount: params.amountCents,
      currency: "ZAR",
      successUrl: params.successUrl,
      cancelUrl: params.cancelUrl,
      failureUrl: params.failureUrl,
      metadata: { orderId: params.orderId, orderNumber: params.orderNumber },
    }),
    cache: "no-store",
  });

  const data = (await res.json().catch(() => ({}))) as Partial<YocoCheckout> & { message?: string };
  if (!res.ok || !data.id || !data.redirectUrl) {
    throw new YocoError(`Yoco checkout failed (${res.status}): ${data.message ?? "unknown error"}`);
  }
  return { id: data.id, redirectUrl: data.redirectUrl, status: data.status ?? "created" };
}

/** Registers our webhook URL with Yoco. Returns the signing secret (shown once). */
export async function registerYocoWebhook(url: string, name = "zen-amour-orders") {
  const res = await fetch(`${YOCO_API}/webhooks`, {
    method: "POST",
    headers: { Authorization: `Bearer ${secretKey()}`, "Content-Type": "application/json" },
    body: JSON.stringify({ name, url }),
  });
  const data = (await res.json().catch(() => ({}))) as { id?: string; secret?: string; message?: string };
  if (!res.ok) throw new YocoError(`Webhook registration failed (${res.status}): ${data.message ?? ""}`);
  return data;
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
}

/**
 * Verifies a Yoco webhook (Standard Webhooks scheme):
 * signed content = `${webhook-id}.${webhook-timestamp}.${rawBody}`,
 * HMAC-SHA256 with the base64 part of the whsec_ secret, base64 encoded.
 */
export function verifyYocoWebhook(rawBody: string, headers: Headers, toleranceSeconds = 180): boolean {
  const secret = process.env.YOCO_WEBHOOK_SECRET;
  if (!secret) return false;

  const id = headers.get("webhook-id");
  const timestamp = headers.get("webhook-timestamp");
  const signatureHeader = headers.get("webhook-signature");
  if (!id || !timestamp || !signatureHeader) return false;

  const ts = Number(timestamp);
  if (!Number.isFinite(ts) || Math.abs(Date.now() / 1000 - ts) > toleranceSeconds) return false;

  const key = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  const expected = crypto.createHmac("sha256", key).update(`${id}.${timestamp}.${rawBody}`).digest("base64");

  return signatureHeader
    .split(" ")
    .map((part) => part.split(",")[1])
    .some((sig) => Boolean(sig) && safeEqual(sig, expected));
}

export interface YocoWebhookEvent {
  id: string;
  type: string; // "payment.succeeded", "refund.succeeded", ...
  createdDate?: string;
  payload: {
    id: string; // payment id
    amount: number; // cents
    currency: string;
    status?: string;
    metadata?: { checkoutId?: string; orderId?: string; orderNumber?: string };
  };
}
