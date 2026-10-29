import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Clock, Landmark, Loader2, MapPin } from "lucide-react";
import { OrderClientEffects } from "@/components/checkout/OrderClientEffects";
import { db } from "@/lib/db";
import { DELIVERY_OPTIONS, PAID_STATUSES } from "@/lib/constants";
import { getSettings } from "@/lib/settings";
import { formatZAR, toNumber } from "@/lib/utils";

export const metadata: Metadata = { title: "Order confirmed", robots: { index: false } };

type SearchParams = Promise<{ ref?: string }>;

export default async function CheckoutSuccessPage({ searchParams }: { searchParams: SearchParams }) {
  const { ref } = await searchParams;
  if (!ref) notFound();
  const order = await db.order.findUnique({ where: { id: ref }, include: { items: true } });
  if (!order) notFound();
  const settings = await getSettings();

  const paid = PAID_STATUSES.includes(order.status) || Boolean(order.paidAt);
  const isEft = order.gateway === "EFT";
  const waiting = !paid && !isEft && order.status === "PENDING_PAYMENT";
  const address = order.shippingAddress as Record<string, string>;

  return (
    <div className="container-luxe max-w-3xl py-16">
      <OrderClientEffects
        orderId={order.orderNumber}
        paid={paid}
        waiting={waiting}
        total={toNumber(order.totalAmount)}
        shipping={toNumber(order.shippingCost)}
        items={order.items.map((i) => ({ id: i.sku, name: i.productName, price: toNumber(i.price), quantity: i.quantity }))}
      />

      <div className="text-center">
        {paid ? (
          <CheckCircle2 className="mx-auto h-14 w-14 text-gold-400" strokeWidth={1.2} />
        ) : waiting ? (
          <Loader2 className="mx-auto h-14 w-14 animate-spin text-gold-400" strokeWidth={1.2} />
        ) : (
          <Clock className="mx-auto h-14 w-14 text-gold-400" strokeWidth={1.2} />
        )}
        <p className="eyebrow mt-6">Order {order.orderNumber}</p>
        <h1 className="mt-3 font-serif text-5xl font-light text-white">
          {paid ? "Thank you — it's confirmed" : waiting ? "Confirming your payment…" : isEft ? "Order received" : "Payment pending"}
        </h1>
        <p className="mx-auto mt-4 max-w-lg text-zinc-400">
          {paid
            ? `We've received your payment and are preparing your order. A confirmation has been sent to ${order.customerEmail}.`
            : waiting
              ? "This usually takes a few seconds. You can keep this page open — it updates automatically."
              : isEft
                ? "Please complete your EFT using the details below. We'll dispatch as soon as the funds reflect."
                : "We haven't received payment confirmation yet. If you were charged, it will update shortly."}
        </p>
      </div>

      {isEft && !paid && (
        <div className="mt-10 border border-gold-500/40 bg-gold-500/5 p-7">
          <h2 className="flex items-center gap-3 font-serif text-2xl text-white">
            <Landmark className="h-5 w-5 text-gold-400" /> EFT banking details
          </h2>
          <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
            {[
              ["Bank", settings.eftBankName],
              ["Account name", settings.eftAccountName],
              ["Account number", settings.eftAccountNumber],
              ["Branch code", settings.eftBranchCode],
              ["Amount", formatZAR(order.totalAmount)],
              ["Reference", order.orderNumber],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-xs uppercase tracking-[0.18em] text-zinc-500">{k}</dt>
                <dd className="mt-1 font-medium text-white">{v || "—"}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-5 text-xs text-zinc-500">Use your order number as the payment reference. EFT payments usually reflect within 1–2 working days.</p>
        </div>
      )}

      <div className="card mt-10 divide-y divide-ink-500">
        <div className="p-7">
          <h2 className="font-serif text-2xl text-white">Summary</h2>
          <ul className="mt-5 space-y-3 text-sm">
            {order.items.map((i) => (
              <li key={i.id} className="flex justify-between gap-4">
                <span className="text-zinc-300">
                  {i.productName}
                  {i.variantLabel && <span className="text-zinc-500"> · {i.variantLabel}</span>} × {i.quantity}
                </span>
                <span className="text-zinc-200">{formatZAR(toNumber(i.price) * i.quantity)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-5 space-y-2 border-t border-ink-500 pt-5 text-sm">
            <div className="flex justify-between"><dt className="text-zinc-500">Delivery</dt><dd>{toNumber(order.shippingCost) === 0 ? "Free" : formatZAR(order.shippingCost)}</dd></div>
            {toNumber(order.discountAmount) > 0 && (
              <div className="flex justify-between"><dt className="text-zinc-500">Discount ({order.discountCode})</dt><dd className="text-emerald-300">−{formatZAR(order.discountAmount)}</dd></div>
            )}
            <div className="flex justify-between pt-2"><dt className="text-white">Total paid</dt><dd className="font-serif text-2xl text-gold-300">{formatZAR(order.totalAmount)}</dd></div>
          </dl>
        </div>
        <div className="flex gap-4 p-7 text-sm">
          <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-gold-400" />
          <div>
            <p className="font-medium text-white">{DELIVERY_OPTIONS[order.deliveryMethod].label}</p>
            {order.deliveryMethod === "PARGO_PICKUP_POINT" ? (
              <p className="text-zinc-400">{order.pargoPointName} — {[address.address, address.suburb, address.city].filter(Boolean).join(", ")}</p>
            ) : (
              <p className="text-zinc-400">{[address.street, address.suburb, address.city, address.province, address.postalCode].filter(Boolean).join(", ")}</p>
            )}
            <p className="mt-1 text-xs text-zinc-500">Estimated {DELIVERY_OPTIONS[order.deliveryMethod].eta}</p>
          </div>
        </div>
      </div>

      <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
        <Link href="/shop" className="btn-gold">Continue shopping</Link>
        <Link href="/track-order" className="btn-outline">Track your order</Link>
      </div>
    </div>
  );
}
