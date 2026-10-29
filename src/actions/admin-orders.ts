"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { ORDER_STATUSES, STATUS_LABELS } from "@/lib/constants";
import { db } from "@/lib/db";
import { sendShippingUpdate } from "@/lib/email";
import { captureError } from "@/lib/monitoring";
import { appendOrderNote, markOrderPaid } from "@/lib/orders";
import { createPargoShipment } from "@/lib/pargo";
import type { ActionState, OrderStatus } from "@/types";

function refresh(orderId: string) {
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin");
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  _prev: ActionState,
  _formData: FormData,
): Promise<ActionState> {
  const admin = await requireAdmin();
  if (!z.enum(ORDER_STATUSES as [OrderStatus, ...OrderStatus[]]).safeParse(status).success) {
    return { ok: false, message: "Unknown status" };
  }
  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order) return { ok: false, message: "Order not found" };
  if (order.status === "PENDING_PAYMENT" && status !== "CANCELLED") {
    return { ok: false, message: "Confirm the payment first — unpaid orders can only be cancelled." };
  }
  if (order.status === status) return { ok: true, message: "No change" };

  const updated = await db.order.update({ where: { id: orderId }, data: { status } });
  await appendOrderNote(orderId, `Status → ${STATUS_LABELS[status]} by ${admin.email}`);
  if (status === "SHIPPED") await sendShippingUpdate(updated);
  refresh(orderId);
  return { ok: true, message: `Marked as ${STATUS_LABELS[status]}` };
}

export async function confirmPayment(orderId: string, _prev: ActionState, _formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const result = await markOrderPaid(orderId, { source: `Manual confirmation by ${admin.email}` });
  refresh(orderId);
  if (result.updated) return { ok: true, message: "Payment confirmed — stock deducted and customer emailed." };
  return { ok: false, message: result.reason === "already_processed" ? "This order is already paid." : "Order not found." };
}

export async function generatePargoWaybill(orderId: string, _prev: ActionState, _formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order) return { ok: false, message: "Order not found" };
  if (order.pargoWaybillCode) return { ok: false, message: `Waybill already exists: ${order.pargoWaybillCode}` };
  if (order.deliveryMethod === "STANDARD_COURIER") return { ok: false, message: "This order uses standard courier, not Pargo." };
  if (!order.paidAt) return { ok: false, message: "Only paid orders can be sent to Pargo." };

  try {
    const { waybill } = await createPargoShipment(order);
    await db.order.update({
      where: { id: orderId },
      data: { pargoWaybillCode: waybill, pargoStatus: "created", status: order.status === "NEW" ? "PROCESSING" : order.status },
    });
    await appendOrderNote(orderId, `Pargo waybill ${waybill} created.`);
    refresh(orderId);
    return { ok: true, message: `Waybill ${waybill} created` };
  } catch (err) {
    captureError(err, { area: "pargo", orderId, orderNumber: order.orderNumber, extra: { operation: "create-waybill" } });
    return { ok: false, message: (err as Error).message };
  }
}

const trackingSchema = z.object({
  pargoWaybillCode: z.string().trim().max(60).optional(),
  trackingNumber: z.string().trim().max(60).optional(),
});

export async function saveTracking(orderId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = trackingSchema.safeParse({
    pargoWaybillCode: formData.get("pargoWaybillCode") ?? undefined,
    trackingNumber: formData.get("trackingNumber") ?? undefined,
  });
  if (!parsed.success) return { ok: false, message: "Tracking codes must be 60 characters or fewer." };
  await db.order.update({
    where: { id: orderId },
    data: {
      pargoWaybillCode: parsed.data.pargoWaybillCode || null,
      trackingNumber: parsed.data.trackingNumber || null,
    },
  });
  refresh(orderId);
  return { ok: true, message: "Tracking saved" };
}

export async function addOrderNote(orderId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const note = String(formData.get("note") ?? "").trim().slice(0, 1000);
  if (!note) return { ok: false, message: "Write a note first." };
  await appendOrderNote(orderId, `${admin.email}: ${note}`);
  refresh(orderId);
  return { ok: true, message: "Note added" };
}
