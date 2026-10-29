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

/** Creates the order in PENDING_PAYMENT with a snapshot of every line. */
export async function createPendingOrder(input: CheckoutInput, quote: Quote) {
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
      // Order number collision — extremely rare, just try another.
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") continue;
      throw err;
    }
  }
  throw new Error("Could not allocate an order number");
}
