"use client";

import { useActionState, useState } from "react";
import { Check } from "lucide-react";
import { trackOrder, type TrackResult } from "@/actions/track-order";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { DELIVERY_OPTIONS, STATUS_LABELS } from "@/lib/constants";
import { cn, formatDate, formatZAR } from "@/lib/utils";
import type { OrderStatus } from "@/types";

const STEPS: OrderStatus[] = ["NEW", "PROCESSING", "SHIPPED", "DELIVERED"];
const STEP_LABELS: Record<string, string> = {
  NEW: "Order confirmed",
  PROCESSING: "Being prepared",
  SHIPPED: "On its way",
  DELIVERED: "Delivered / collected",
};

export function TrackOrderForm() {
  const [state, action] = useActionState<TrackResult, FormData>(trackOrder, { ok: false });
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const order = state.order;
  const stepIndex = order ? STEPS.indexOf(order.status) : -1;

  return (
    <div className="space-y-10">
      <form action={action} className="card grid gap-5 p-7 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <div>
          <label className="label" htmlFor="orderNumber">Order number</label>
          <input id="orderNumber" name="orderNumber" required placeholder="ZA-7KQ4MX" value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} className="input uppercase" />
        </div>
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" name="email" type="email" required placeholder="you@example.co.za" value={email} onChange={(e) => setEmail(e.target.value)} className="input" />
        </div>
        <SubmitButton pendingText="Finding…">Track</SubmitButton>
        {state.message && <p className="field-error sm:col-span-3">{state.message}</p>}
      </form>

      {order && (
        <div className="card p-7">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="font-serif text-3xl text-white">{order.orderNumber}</h2>
            <p className="text-sm text-zinc-500">Placed {formatDate(order.createdAt)} · {formatZAR(order.total)}</p>
          </div>

          {stepIndex >= 0 ? (
            <ol className="mt-8 grid gap-4 sm:grid-cols-4">
              {STEPS.map((step, i) => (
                <li key={step} className="flex items-center gap-3 sm:flex-col sm:items-start">
                  <span
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full border text-xs",
                      i <= stepIndex ? "border-gold-400 bg-gold-500 text-ink-900" : "border-ink-500 text-zinc-500",
                    )}
                  >
                    {i < stepIndex ? <Check className="h-4 w-4" /> : i + 1}
                  </span>
                  <span className={cn("text-sm", i <= stepIndex ? "text-white" : "text-zinc-500")}>{STEP_LABELS[step]}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-6 inline-block border border-ink-500 px-3 py-1.5 text-sm text-zinc-300">Status: {STATUS_LABELS[order.status]}</p>
          )}

          <dl className="mt-8 grid gap-5 border-t border-ink-500 pt-6 text-sm sm:grid-cols-2">
            <div>
              <dt className="label">Delivery</dt>
              <dd className="text-zinc-200">{DELIVERY_OPTIONS[order.deliveryMethod].label}</dd>
              {order.pargoPointName && <dd className="text-zinc-400">{order.pargoPointName}</dd>}
            </div>
            <div>
              <dt className="label">Tracking / waybill</dt>
              <dd className="text-zinc-200">{order.waybill ?? "Available once dispatched"}</dd>
              {order.pargoStatus && <dd className="text-zinc-400">Pargo: {order.pargoStatus}</dd>}
            </div>
            <div className="sm:col-span-2">
              <dt className="label">Items</dt>
              {order.items.map((i, idx) => (
                <dd key={idx} className="text-zinc-300">
                  {i.name}{i.variant ? ` · ${i.variant}` : ""} × {i.quantity}
                </dd>
              ))}
            </div>
          </dl>
        </div>
      )}
    </div>
  );
}
