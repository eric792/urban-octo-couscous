import crypto from "node:crypto";
import dns from "node:dns/promises";

// Payfast redirect checkout + ITN (Instant Transaction Notification) — https://developers.payfast.co.za

const VALID_HOSTS = ["www.payfast.co.za", "sandbox.payfast.co.za", "w1w.payfast.co.za", "w2w.payfast.co.za"];

export class PayfastError extends Error {}

export function payfastConfig() {
  const merchantId = process.env.PAYFAST_MERCHANT_ID;
  const merchantKey = process.env.PAYFAST_MERCHANT_KEY;
  const sandbox = process.env.PAYFAST_SANDBOX !== "false";
  const host = sandbox ? "https://sandbox.payfast.co.za" : "https://www.payfast.co.za";
  return {
    merchantId,
    merchantKey,
    passphrase: process.env.PAYFAST_PASSPHRASE || "",
    sandbox,
    processUrl: `${host}/eng/process`,
    validateUrl: `${host}/eng/query/validate`,
    configured: Boolean(merchantId && merchantKey),
  };
}

/** URL-encodes like PHP's urlencode (Payfast's reference implementation). */
function encodePhp(value: string): string {
  return encodeURIComponent(value)
    .replace(/[!'()*~]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`)
    .replace(/%20/g, "+");
}

/** URL-encodes like Payfast's Node.js sample (encodeURIComponent). */
function encodeJs(value: string): string {
  return encodeURIComponent(value).replace(/%20/g, "+");
}

function md5(input: string): string {
  return crypto.createHash("md5").update(input).digest("hex");
}

function paramString(entries: [string, string][], encode: (v: string) => string, skipEmpty: boolean): string {
  return entries
    .filter(([, v]) => !skipEmpty || v !== "")
    .map(([k, v]) => `${k}=${encode(v.trim())}`)
    .join("&");
}

function withPassphrase(base: string, passphrase: string, encode: (v: string) => string): string {
  return passphrase ? `${base}&passphrase=${encode(passphrase.trim())}` : base;
}

/** Removes characters the two encoders disagree on, so signatures always match. */
function clean(value: string, max = 100): string {
  return value.replace(/[!'()*~"<>]/g, "").replace(/\s+/g, " ").trim().slice(0, max);
}

export function buildPayfastCheckout(params: {
  orderId: string;
  orderNumber: string;
  amount: number; // rand
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  returnUrl: string;
  cancelUrl: string;
  notifyUrl: string;
}): { action: string; fields: Record<string, string> } {
  const cfg = payfastConfig();
  if (!cfg.configured) throw new PayfastError("Payfast is not configured. Set PAYFAST_MERCHANT_ID and PAYFAST_MERCHANT_KEY.");

  // Field order matters for the signature — it follows Payfast's documented order.
  const entries: [string, string][] = [
    ["merchant_id", cfg.merchantId!],
    ["merchant_key", cfg.merchantKey!],
    ["return_url", params.returnUrl],
    ["cancel_url", params.cancelUrl],
    ["notify_url", params.notifyUrl],
    ["name_first", clean(params.firstName)],
    ["name_last", clean(params.lastName)],
    ["email_address", params.email.trim()],
    ["cell_number", params.phone && /^0\d{9}$/.test(params.phone) ? params.phone : ""],
    ["m_payment_id", params.orderId],
    ["amount", params.amount.toFixed(2)],
    ["item_name", `Zen Amour order ${params.orderNumber}`],
    ["custom_str1", params.orderNumber],
  ];

  const filtered = entries.filter(([, v]) => v !== "");
  const signature = md5(withPassphrase(paramString(filtered, encodeJs, true), cfg.passphrase, encodeJs));
  return {
    action: cfg.processUrl,
    fields: { ...Object.fromEntries(filtered), signature },
  };
}

export type ItnCheck =
  | { valid: true; data: Record<string, string> }
  | { valid: false; reason: string; data?: Record<string, string> };

async function ipIsPayfast(ip: string): Promise<boolean> {
  const results = await Promise.all(VALID_HOSTS.map((h) => dns.resolve4(h).catch(() => [] as string[])));
  return results.flat().includes(ip);
}

/**
 * Runs Payfast's ITN security checks:
 * 1. signature, 2. source IP (optional), 3. server-side confirmation with Payfast.
 * The amount check happens in the route against the stored order.
 */
export async function verifyPayfastItn(rawBody: string, sourceIp: string | null): Promise<ItnCheck> {
  const cfg = payfastConfig();
  const params = new URLSearchParams(rawBody);
  const entries: [string, string][] = [];
  for (const [k, v] of params) {
    if (k === "signature") break; // Payfast places the signature last
    entries.push([k, v]);
  }
  const data = Object.fromEntries(params.entries());
  const received = params.get("signature");
  if (!received) return { valid: false, reason: "missing signature", data };

  const php = paramString(entries, encodePhp, false);
  const js = paramString(entries, encodeJs, false);
  const signatureOk =
    md5(withPassphrase(php, cfg.passphrase, encodePhp)) === received ||
    md5(withPassphrase(js, cfg.passphrase, encodeJs)) === received;
  if (!signatureOk) return { valid: false, reason: "signature mismatch", data };

  if (data.merchant_id && cfg.merchantId && data.merchant_id !== cfg.merchantId) {
    return { valid: false, reason: "merchant id mismatch", data };
  }

  if (process.env.PAYFAST_VERIFY_SOURCE_IP === "true") {
    if (!sourceIp || !(await ipIsPayfast(sourceIp))) return { valid: false, reason: `untrusted source IP ${sourceIp}`, data };
  }

  try {
    const res = await fetch(cfg.validateUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: php,
      cache: "no-store",
    });
    const text = (await res.text()).trim();
    if (text !== "VALID") return { valid: false, reason: `server confirmation returned "${text.slice(0, 40)}"`, data };
  } catch (err) {
    return { valid: false, reason: `server confirmation failed: ${(err as Error).message}`, data };
  }

  return { valid: true, data };
}
