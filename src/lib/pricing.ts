import type { DiscountCode } from "@prisma/client";
import { db } from "@/lib/db";
import type { StoreConfig } from "@/lib/settings";
import { formatZAR, fromCents, toCents } from "@/lib/utils";
import type { QuoteInput } from "@/lib/validation";
import type { DeliveryMethod, Quote, QuoteLine } from "@/types";

export function shippingFeeCents(method: DeliveryMethod, settings: StoreConfig): number {
  switch (method) {
    case "PARGO_PICKUP_POINT":
      return toCents(settings.pargoPickupFee);
    case "PARGO_COURIER_DOOR":
      return toCents(settings.pargoDoorFee);
    case "STANDARD_COURIER":
      return toCents(settings.courierFee);
  }
}

type DiscountResult =
  | { ok: true; discount: DiscountCode; amountCents: number; freeShipping: boolean; message: string }
  | { ok: false; error: string };

export async function evaluateDiscount(rawCode: string, subtotalCents: number): Promise<DiscountResult> {
  const code = rawCode.trim().toUpperCase();
  const discount = await db.discountCode.findUnique({ where: { code } });
  if (!discount || !discount.active) return { ok: false, error: "This code isn't valid" };
  if (discount.expiresAt && discount.expiresAt < new Date()) return { ok: false, error: "This code has expired" };
  if (discount.maxUses !== null && discount.usedCount >= discount.maxUses) {
    return { ok: false, error: "This code has been fully redeemed" };
  }
  const minCents = discount.minSubtotal ? toCents(discount.minSubtotal) : 0;
  if (subtotalCents < minCents) {
    return { ok: false, error: `Spend ${formatZAR(fromCents(minCents))} or more to use this code` };
  }

  const value = discount.value.toNumber();
  if (discount.type === "PERCENTAGE") {
    const pct = Math.min(Math.max(value, 0), 100);
    return {
      ok: true,
      discount,
      amountCents: Math.round((subtotalCents * pct) / 100),
      freeShipping: false,
      message: `${pct}% off applied`,
    };
  }
  if (discount.type === "FIXED_AMOUNT") {
    const amountCents = Math.min(toCents(value), subtotalCents);
    return { ok: true, discount, amountCents, freeShipping: false, message: `${formatZAR(value)} off applied` };
  }
  return { ok: true, discount, amountCents: 0, freeShipping: true, message: "Free delivery applied" };
}

/**
 * Builds an authoritative price quote from the database.
 * The browser only sends variant ids and quantities — never prices.
 */
export async function buildQuote(input: QuoteInput, settings: StoreConfig): Promise<Quote> {
  const quantities = new Map<string, number>();
  for (const item of input.items) {
    quantities.set(item.variantId, Math.min((quantities.get(item.variantId) ?? 0) + item.quantity, 20));
  }

  const variants = await db.productVariant.findMany({
    where: { id: { in: [...quantities.keys()] } },
    include: { product: { select: { id: true, name: true, slug: true, images: true, isActive: true } } },
  });

  const issues: string[] = [];
  const lines: QuoteLine[] = [];
  let subtotalCents = 0;

  for (const [variantId, quantity] of quantities) {
    const v = variants.find((x) => x.id === variantId);
    if (!v || !v.product.isActive) {
      issues.push("An item in your bag is no longer available. Please remove it to continue.");
      continue;
    }
    const label = v.volume ? `${v.product.name} (${v.volume})` : v.product.name;
    if (v.stock <= 0) issues.push(`${label} is sold out.`);
    else if (quantity > v.stock) issues.push(`Only ${v.stock} of ${label} left in stock.`);

    const unitCents = toCents(v.price);
    subtotalCents += unitCents * quantity;
    lines.push({
      variantId,
      productId: v.product.id,
      productName: v.product.name,
      variantLabel: v.volume,
      sku: v.sku,
      slug: v.product.slug,
      image: v.product.images[0] ?? null,
      unitPrice: fromCents(unitCents),
      quantity,
      lineTotal: fromCents(unitCents * quantity),
      stock: v.stock,
    });
  }

  let discountCents = 0;
  let freeShippingFromCode = false;
  let discountCode: string | null = null;
  let discountMessage: string | null = null;
  let discountError: string | null = null;

  if (input.discountCode) {
    const result = await evaluateDiscount(input.discountCode, subtotalCents);
    if (result.ok) {
      discountCents = result.amountCents;
      freeShippingFromCode = result.freeShipping;
      discountCode = result.discount.code;
      discountMessage = result.message;
    } else {
      discountError = result.error;
    }
  }

  const thresholdCents = toCents(settings.freeShippingThreshold);
  const afterDiscount = subtotalCents - discountCents;
  const freeShipping =
    freeShippingFromCode || (thresholdCents > 0 && afterDiscount >= thresholdCents);
  const shippingCents = lines.length === 0 || freeShipping ? 0 : shippingFeeCents(input.deliveryMethod, settings);

  return {
    lines,
    subtotal: fromCents(subtotalCents),
    discount: fromCents(discountCents),
    shipping: fromCents(shippingCents),
    total: fromCents(afterDiscount + shippingCents),
    discountCode,
    discountMessage,
    discountError,
    freeShipping,
    amountToFreeShipping: thresholdCents > 0 ? fromCents(Math.max(thresholdCents - afterDiscount, 0)) : 0,
    issues,
  };
}
