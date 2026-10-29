import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { withApi } from "@/lib/api";
import { db } from "@/lib/db";
import { appendOrderNote } from "@/lib/orders";

/**
 * Pargo status webhook. Give Pargo this URL:
 *   https://YOUR-DOMAIN/api/webhooks/pargo?secret=PARGO_WEBHOOK_SECRET
 * (or send the secret in an "x-pargo-secret" header).
 */

function secretMatches(provided: string | null): boolean {
  const expected = process.env.PARGO_WEBHOOK_SECRET;
  if (!expected || !provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function pick(obj: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === "string" && value) return value;
  }
  return null;
}

export const POST = withApi({ name: "webhook.pargo", rateLimit: ["webhook"], maxBodyBytes: 65_536 }, async (req, ctx) => {
  const url = new URL(req.url);
  if (!secretMatches(url.searchParams.get("secret") ?? req.headers.get("x-pargo-secret"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = ctx.json<Record<string, unknown> | null>();
  if (!body || typeof body !== "object") return NextResponse.json({ ok: false, code: "BAD_REQUEST", message: "Expected a JSON object" }, { status: 400 });

  const nested = [body, body.data, (body.data as Record<string, unknown> | undefined)?.attributes].filter(
    (v): v is Record<string, unknown> => Boolean(v) && typeof v === "object",
  );
  const field = (keys: string[]) => nested.map((o) => pick(o, keys)).find(Boolean) ?? null;

  const waybill = field(["trackingCode", "tracking_code", "waybill", "waybillNumber"]);
  const reference = field(["externalReference", "external_reference", "orderNumber", "order_number"]);
  const status = field(["status", "orderStatus", "event", "state"]);
  if (!status || (!waybill && !reference)) {
    return NextResponse.json({ error: "Missing status or reference" }, { status: 400 });
  }

  const order = await db.order.findFirst({
    where: {
      OR: [
        ...(waybill ? [{ pargoWaybillCode: waybill }] : []),
        ...(reference ? [{ orderNumber: reference }] : []),
      ],
    },
  });
  if (!order) return NextResponse.json({ received: true, matched: false });

  const s = status.toLowerCase();
  const inTransit = /(transit|at_pickup|ready|dispatch|shipped|from_warehouse)/.test(s);
  const done = !inTransit && /(collected|delivered|completed)/.test(s);
  const nextStatus =
    done && ["NEW", "PROCESSING", "SHIPPED"].includes(order.status)
      ? "DELIVERED"
      : inTransit && ["NEW", "PROCESSING"].includes(order.status)
        ? "SHIPPED"
        : undefined;

  await db.order.update({
    where: { id: order.id },
    data: {
      pargoStatus: status,
      ...(waybill && !order.pargoWaybillCode ? { pargoWaybillCode: waybill } : {}),
      ...(nextStatus ? { status: nextStatus } : {}),
    },
  });
  await appendOrderNote(order.id, `Pargo: ${status}${nextStatus ? ` → ${nextStatus}` : ""}`);

  return NextResponse.json({ received: true, matched: true });
});
