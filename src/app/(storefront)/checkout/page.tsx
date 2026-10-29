import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { availableGateways } from "@/lib/checkout";
import { getSettings, toPublicSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "Secure Checkout", robots: { index: false } };

export default async function CheckoutPage() {
  const settings = await getSettings();
  return (
    <div className="container-luxe py-14">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Secure checkout</p>
          <h1 className="mt-3 font-serif text-5xl font-light text-white">Checkout</h1>
        </div>
        <p className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-zinc-500">
          <ShieldCheck className="h-4 w-4 text-gold-400" /> SSL secured · Payments in ZAR
        </p>
      </div>
      <CheckoutForm settings={toPublicSettings(settings)} gateways={availableGateways(settings)} />
    </div>
  );
}
