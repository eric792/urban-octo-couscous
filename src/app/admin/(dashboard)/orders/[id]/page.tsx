import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CreditCard, Mail, MapPin, Phone, Truck } from "lucide-react";
import { addOrderNote, confirmPayment, generatePargoWaybill, saveTracking, updateOrderStatus } from "@/actions/admin-orders";
import { ActionForm } from "@/components/admin/ActionForm";
import { OrderStatusBadge } from "@/components/admin/OrderStatusBadge";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { DELIVERY_OPTIONS, GATEWAY_LABELS, STATUS_LABELS } from "@/lib/constants";
import { db } from "@/lib/db";
import { formatDate, formatZAR, toNumber, whatsappLink } from "@/lib/utils";
import type { OrderStatus } from "@/types";

export const metadata = { title: "Order" };

const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING_PAYMENT: ["CANCELLED"],
  NEW: ["PROCESSING", "SHIPPED", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: ["REFUNDED"],
  CANCELLED: [],
  REFUNDED: [],
};

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await db.order.findUnique({ where: { id }, include: { items: true } });
  if (!order) notFound();

  const address = order.shippingAddress as Record<string, string>;
  const isPargo = order.deliveryMethod !== "STANDARD_COURIER";
  const notes = (order.notes ?? "").split("\n").filter(Boolean).reverse();

  return (
    <>
      <Link href="/admin/orders" className="mb-6 inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white">
        <ArrowLeft className="h-4 w-4" /> All orders
      </Link>

      <div className="mb-8 flex flex-col justify-between gap-4 border-b border-zinc-800 pb-6 md:flex-row md:items-center">
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-gold-400">Order</span>
          <h1 className="mt-1 flex items-center gap-4 font-serif text-3xl font-light text-white">
            #{order.orderNumber} <OrderStatusBadge status={order.status} />
          </h1>
          <p className="mt-1 text-sm text-zinc-500">Placed {formatDate(order.createdAt, true)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {TRANSITIONS[order.status].map((to) => (
            <ActionForm
              key={to}
              action={updateOrderStatus.bind(null, order.id, to)}
              confirmText={to === "CANCELLED" || to === "REFUNDED" ? `Mark ${order.orderNumber} as ${STATUS_LABELS[to].toLowerCase()}?` : undefined}
            >
              <SubmitButton variant={to === "CANCELLED" || to === "REFUNDED" ? "admin-secondary" : "admin"}>
                Mark {STATUS_LABELS[to].toLowerCase()}
              </SubmitButton>
            </ActionForm>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="admin-card overflow-hidden">
            <h2 className="border-b border-zinc-800 px-6 py-4 font-medium text-white">Items</h2>
            <table className="w-full text-sm">
              <tbody className="divide-y divide-zinc-800/60">
                {order.items.map((i) => (
                  <tr key={i.id}>
                    <td className="px-6 py-3">
                      <p className="text-zinc-200">{i.productName}{i.variantLabel && <span className="text-zinc-500"> · {i.variantLabel}</span>}</p>
                      <p className="font-mono text-xs text-zinc-600">{i.sku}</p>
                    </td>
                    <td className="px-6 py-3 text-zinc-400">{formatZAR(i.price)} × {i.quantity}</td>
                    <td className="px-6 py-3 text-right text-white">{formatZAR(toNumber(i.price) * i.quantity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <dl className="space-y-2 border-t border-zinc-800 px-6 py-4 text-sm">
              <div className="flex justify-between"><dt className="text-zinc-500">Subtotal</dt><dd>{formatZAR(order.subtotal)}</dd></div>
              {toNumber(order.discountAmount) > 0 && (
                <div className="flex justify-between"><dt className="text-zinc-500">Discount ({order.discountCode})</dt><dd className="text-emerald-300">−{formatZAR(order.discountAmount)}</dd></div>
              )}
              <div className="flex justify-between"><dt className="text-zinc-500">Delivery</dt><dd>{formatZAR(order.shippingCost)}</dd></div>
              <div className="flex justify-between border-t border-zinc-800 pt-2 text-base"><dt className="text-white">Total</dt><dd className="font-semibold text-gold-300">{formatZAR(order.totalAmount)}</dd></div>
            </dl>
          </section>

          <section className="admin-card p-6">
            <h2 className="flex items-center gap-2 font-medium text-white"><Truck className="h-4 w-4 text-gold-400" /> Fulfilment</h2>
            <div className="mt-4 grid gap-6 sm:grid-cols-2">
              <div className="text-sm">
                <p className="text-xs uppercase tracking-wider text-zinc-500">{DELIVERY_OPTIONS[order.deliveryMethod].label}</p>
                {order.deliveryMethod === "PARGO_PICKUP_POINT" ? (
                  <>
                    <p className="mt-2 text-white">{order.pargoPointName}</p>
                    <p className="text-zinc-400">{[address.address, address.suburb, address.city].filter(Boolean).join(", ")}</p>
                    <p className="mt-1 font-mono text-xs text-zinc-500">Point code: {order.pargoPointId}</p>
                  </>
                ) : (
                  <p className="mt-2 flex gap-2 text-zinc-300">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500" />
                    {[address.street, address.suburb, address.city, address.province, address.postalCode].filter(Boolean).join(", ")}
                  </p>
                )}
                {order.pargoStatus && <p className="mt-3 text-xs text-zinc-400">Pargo status: <span className="text-white">{order.pargoStatus}</span></p>}
              </div>

              <div className="space-y-4">
                {isPargo && !order.pargoWaybillCode && order.paidAt && (
                  <ActionForm action={generatePargoWaybill.bind(null, order.id)}>
                    <SubmitButton variant="admin" pendingText="Contacting Pargo…" className="w-full">Generate Pargo waybill</SubmitButton>
                  </ActionForm>
                )}
                <ActionForm action={saveTracking.bind(null, order.id)} className="space-y-3">
                  {isPargo && (
                    <div>
                      <label className="admin-label" htmlFor="pargoWaybillCode">Pargo waybill</label>
                      <input id="pargoWaybillCode" name="pargoWaybillCode" defaultValue={order.pargoWaybillCode ?? ""} className="admin-input font-mono" />
                    </div>
                  )}
                  <div>
                    <label className="admin-label" htmlFor="trackingNumber">Courier tracking #</label>
                    <input id="trackingNumber" name="trackingNumber" defaultValue={order.trackingNumber ?? ""} className="admin-input font-mono" />
                  </div>
                  <SubmitButton variant="admin-secondary" pendingText="Saving…">Save tracking</SubmitButton>
                </ActionForm>
              </div>
            </div>
          </section>

          <section className="admin-card p-6">
            <h2 className="font-medium text-white">Timeline &amp; notes</h2>
            <ActionForm action={addOrderNote.bind(null, order.id)} className="mt-4 flex gap-2" resetOnSuccess>
              <input name="note" placeholder="Add an internal note…" className="admin-input" maxLength={1000} />
              <SubmitButton variant="admin-secondary">Add</SubmitButton>
            </ActionForm>
            <ul className="mt-5 space-y-3 text-sm">
              {notes.length === 0 && <li className="text-zinc-500">No notes yet.</li>}
              {notes.map((n, i) => {
                const match = n.match(/^\[(.+?)\]\s(.*)$/);
                return (
                  <li key={i} className="border-l-2 border-zinc-800 pl-4">
                    {match ? (
                      <>
                        <p className="text-zinc-300">{match[2]}</p>
                        <p className="text-xs text-zinc-600">{formatDate(match[1], true)}</p>
                      </>
                    ) : (
                      <p className="text-zinc-300">{n}</p>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        </div>

        <div className="space-y-6">
          <section className="admin-card p-6 text-sm">
            <h2 className="font-medium text-white">Customer</h2>
            <p className="mt-3 text-zinc-200">{order.customerName}</p>
            <a href={`mailto:${order.customerEmail}`} className="mt-2 flex items-center gap-2 text-zinc-400 hover:text-gold-300">
              <Mail className="h-4 w-4" /> {order.customerEmail}
            </a>
            {order.customerPhone && (
              <a href={whatsappLink(order.customerPhone, `Hi ${order.customerName.split(" ")[0]}, this is Zen Amour about order ${order.orderNumber}.`)} target="_blank" rel="noopener noreferrer" className="mt-2 flex items-center gap-2 text-zinc-400 hover:text-gold-300">
                <Phone className="h-4 w-4" /> {order.customerPhone} (WhatsApp)
              </a>
            )}
            <Link href={`/admin/customers?q=${encodeURIComponent(order.customerEmail)}`} className="mt-4 inline-block text-xs text-gold-400 hover:text-gold-300">
              View customer history →
            </Link>
          </section>

          <section className="admin-card p-6 text-sm">
            <h2 className="flex items-center gap-2 font-medium text-white"><CreditCard className="h-4 w-4 text-gold-400" /> Payment</h2>
            <dl className="mt-3 space-y-2">
              <div className="flex justify-between"><dt className="text-zinc-500">Method</dt><dd>{GATEWAY_LABELS[order.gateway]}</dd></div>
              <div className="flex justify-between"><dt className="text-zinc-500">Status</dt><dd>{order.paidAt ? <span className="text-emerald-300">Paid {formatDate(order.paidAt, true)}</span> : <span className="text-zinc-400">Not paid</span>}</dd></div>
              {order.gatewayTxId && <div className="flex justify-between gap-4"><dt className="text-zinc-500">Reference</dt><dd className="truncate font-mono text-xs">{order.gatewayTxId}</dd></div>}
              {order.gatewayRef && <div className="flex justify-between gap-4"><dt className="text-zinc-500">Checkout</dt><dd className="truncate font-mono text-xs">{order.gatewayRef}</dd></div>}
            </dl>
            {!order.paidAt && order.status !== "REFUNDED" && (
              <ActionForm
                action={confirmPayment.bind(null, order.id)}
                className="mt-5"
                confirmText={`Confirm you have received ${formatZAR(order.totalAmount)} for ${order.orderNumber}?`}
              >
                <SubmitButton variant="admin" className="w-full" pendingText="Confirming…">
                  {order.gateway === "EFT" ? "Confirm EFT received" : "Mark as paid manually"}
                </SubmitButton>
                <p className="mt-2 text-xs text-zinc-500">Only do this once the money reflects in your bank or gateway dashboard.</p>
              </ActionForm>
            )}
            {order.paidAt && (order.status === "REFUNDED") && (
              <p className="mt-4 text-xs text-zinc-500">Process the actual refund in your {order.gateway === "YOCO" ? "Yoco" : order.gateway === "PAYFAST" ? "Payfast" : "banking"} dashboard.</p>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
