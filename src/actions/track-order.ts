"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { clientIp, rateLimit, tooManyMessage } from "@/lib/rate-limit";
import { toNumber } from "@/lib/utils";
import type { DeliveryMethod, OrderStatus } from "@/types";

export interface TrackResult {
  ok: boolean;
  message?: string;
  order?: {
    orderNumber: string;
    status: OrderStatus;
    createdAt: string;
    total: number;
    deliveryMethod: DeliveryMethod;
    pargoPointName: string | null;
    waybill: string | null;
    pargoStatus: string | null;
    items: { name: string; variant: string | null; quantity: number }[];
  };
}

const schema = z.object({
  orderNumber: z.string().trim().toUpperCase().regex(/^#?ZA-[A-Z0-9]{4,10}$/, "Enter your order number, e.g. ZA-7KQ4MX"),
  email: z.email("Enter the email you used at checkout"),
});

export async function trackOrder(_prev: TrackResult, formData: FormData): Promise<TrackResult> {
  const limited = await rateLimit("trackOrder", await clientIp());
  if (!limited.success) return { ok: false, message: tooManyMessage(limited) };
  const parsed = schema.safeParse({
    orderNumber: formData.get("orderNumber"),
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
  });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };

  const order = await db.order.findFirst({
    where: { orderNumber: parsed.data.orderNumber.replace(/^#/, ""), customerEmail: parsed.data.email },
    include: { items: true },
  });
  // Same message either way, so order numbers can't be probed.
  if (!order) return { ok: false, message: "We couldn't find an order with those details." };

  return {
    ok: true,
    order: {
      orderNumber: order.orderNumber,
      status: order.status,
      createdAt: order.createdAt.toISOString(),
      total: toNumber(order.totalAmount),
      deliveryMethod: order.deliveryMethod,
      pargoPointName: order.pargoPointName,
      waybill: order.pargoWaybillCode || order.trackingNumber,
      pargoStatus: order.pargoStatus,
      items: order.items.map((i) => ({ name: i.productName, variant: i.variantLabel, quantity: i.quantity })),
    },
  };
}
