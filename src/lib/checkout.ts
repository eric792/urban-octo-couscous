import crypto from "node:crypto";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { payfastConfig } from "@/lib/payments/payfast";
import type { StoreConfig } from "@/lib/settings";
import { generateOrderNumber } from "@/lib/utils";
import type { CheckoutInput } from "@/lib/validation";
import type { PaymentGateway, Quote } from "@/types";

/** Gateways that are switched on in Admin → Settings and have credentials. */
export function availableGateways(settings: StoreConfig): PaymentGateway[] {
  const list: PaymentGateway[] = [];
  if (settings.yocoEnabled && process.env.YOCO_SECRET_KEY) list.push("YOCO");
  if (settings.payfastEnabled && payfastConfig().configured) list.push("PAYFAST");
  if (settings.eftEnabled && settings.eftAccountNumber) list.push("EFT");
  return list;
}

/**
 * Stable fingerprint of what the shopper is buying and how they're paying.
 * Two submissions with the same fingerprint are the same purchase.
 */
export function requestFingerprint(input: CheckoutInput): string {
  const items = new Map<string, number>();
  for (const i of input.items) items.set(i.variantId, (items.get(i.variantId) ?? 0) + i.quantity);
  const normalized = {
    items: [...items.entries()].sort(([a], [b]) => a.localeCompare(b)),
    delivery: input.deliveryMethod,
    pickup: input.deliveryMethod === "PARGO_PICKUP_POINT" ? input.pickupPoint?.id : null,
    address:
      input.deliveryMethod === "PARGO_PICKUP_POINT"
        ? null
        : [input.address?.street, input.address?.suburb, input.address?.city, input.address?.province, input.address?.postalCode]
            .map((v) => (v ?? "").trim().toLowerCase())
            .join("|"),
    discount: input.discountCode?.trim().toUpperCase() || null,
    gateway: input.gateway,
    email: input.customer.email.trim().toLowerCase(),
  };
  return crypto.createHash("sha256").update(JSON.stringify(normalized)).digest("hex");
}

function isUniqueViolationOn(err: unknown, field: string): boolean {
  if (!(err instanceof Prisma.PrismaClientKnownRequestError) || err.code !== "P2002") return false;
  const target = err.meta?.target;
  return Array.isArray(target) ? target.includes(field) : String(target ?? "").includes(field);
}

export class DuplicateAttemptError extends Error {
  constructor() {
    super("Duplicate checkout attempt");
    this.name = "DuplicateAttemptError";
  }
}

/** Creates the order in PENDING_PAYMENT with a snapshot of every line. */
export async function createPendingOrder(
  input: CheckoutInput,
  quote: Quote,
  guard: { idempotencyKey: string | null; requestHash: string },
) {
  const customerName = `${input.customer.firstName} ${input.customer.lastName}`.trim();
  const shippingAddress =
    input.deliveryMethod === "PARGO_PICKUP_POINT" && input.pickupPoint
      ? { type: "pargo_point", ...input.pickupPoint }
      : { type: "address", ...input.address };

  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      return await db.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          idempotencyKey: guard.idempotencyKey,
          requestHash: guard.requestHash,
          guestEmail: input.customer.email.toLowerCase(),
          customerName,
          customerEmail: input.customer.email.toLowerCase(),
          customerPhone: input.customer.phone,
          status: "PENDING_PAYMENT",
          subtotal: quote.subtotal,
          discountAmount: quote.discount,
          discountCode: quote.discountCode,
          shippingCost: quote.shipping,
          totalAmount: quote.total,
          gateway: input.gateway,
          deliveryMethod: input.deliveryMethod,
          pargoPointId: input.deliveryMethod === "PARGO_PICKUP_POINT" ? input.pickupPoint?.id : null,
          pargoPointName: input.deliveryMethod === "PARGO_PICKUP_POINT" ? input.pickupPoint?.name : null,
          shippingAddress,
          notes: input.notes ? `Customer note: ${input.notes}` : null,
          items: {
            create: quote.lines.map((line) => ({
              variantId: line.variantId,
              productName: line.productName,
              variantLabel: line.variantLabel,
              sku: line.sku,
              quantity: line.quantity,
              price: line.unitPrice,
            })),
          },
        },
      });
    } catch (err) {
      // A concurrent request with the same key won the race.
      if (isUniqueViolationOn(err, "idempotencyKey")) throw new DuplicateAttemptError();
      // Order number collision — extremely rare, just try another.
      if (isUniqueViolationOn(err, "orderNumber")) continue;
      throw err;
    }
  }
  throw new Error("Could not allocate an order number");
}

/** An unpaid order for the same purchase in the last 15 minutes (e.g. a second tab). */
export async function findRecentPendingOrder(email: string, requestHash: string) {
  return db.order.findFirst({
    where: {
      customerEmail: email.toLowerCase(),
      requestHash,
      status: "PENDING_PAYMENT",
      paidAt: null,
      createdAt: { gte: new Date(Date.now() - 15 * 60_000) },
    },
    orderBy: { createdAt: "desc" },
  });
}
