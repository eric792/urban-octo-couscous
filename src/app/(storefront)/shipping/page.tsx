import type { Metadata } from "next";
import Link from "next/link";
import { InfoPage } from "@/components/storefront/InfoPage";
import { DELIVERY_OPTIONS } from "@/lib/constants";
import { getSettings } from "@/lib/settings";
import { formatZAR } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Shipping & Returns",
  description: "Pargo pickup, door-to-door and courier delivery across South Africa, plus our returns policy.",
};

export default async function ShippingPage() {
  const s = await getSettings();
  const fees = {
    PARGO_PICKUP_POINT: s.pargoPickupFee,
    PARGO_COURIER_DOOR: s.pargoDoorFee,
    STANDARD_COURIER: s.courierFee,
  } as const;

  return (
    <InfoPage eyebrow="Customer care" title="Shipping & Returns" intro="We deliver to all 9 provinces. Orders placed before 12:00 on a working day are packed the same day.">
      <section>
        <h2>Delivery options</h2>
        <div className="card divide-y divide-ink-500">
          {(Object.keys(DELIVERY_OPTIONS) as (keyof typeof DELIVERY_OPTIONS)[]).map((key) => (
            <div key={key} className="flex flex-wrap items-start justify-between gap-3 p-5">
              <div>
                <p className="font-medium text-white">{DELIVERY_OPTIONS[key].label}</p>
                <p className="text-sm">{DELIVERY_OPTIONS[key].description}</p>
                <p className="text-xs text-zinc-500">{DELIVERY_OPTIONS[key].eta}</p>
              </div>
              <p className="text-gold-300">{formatZAR(fees[key])}</p>
            </div>
          ))}
        </div>
        {s.freeShippingThreshold > 0 && (
          <p className="mt-4">Delivery is <strong>free on orders over {formatZAR(s.freeShippingThreshold)}</strong> (after discounts).</p>
        )}
      </section>
      <section>
        <h2>Pargo pickup points</h2>
        <p>
          Choose a Pargo counter at checkout. You&apos;ll receive an SMS and email when your parcel is ready; bring your ID
          or the collection code. Parcels are held for 7 days.
        </p>
      </section>
      <section>
        <h2>Returns</h2>
        <ul className="space-y-2">
          <li>Unopened, sealed products can be returned within <strong>14 days</strong> of delivery for a refund or exchange.</li>
          <li>For hygiene reasons, opened fragrances, skincare and supplements can only be returned if faulty.</li>
          <li>If something arrives damaged, contact us within 48 hours with a photo and we&apos;ll replace it.</li>
          <li>Refunds go back to your original payment method within 5–10 working days of us receiving the return.</li>
        </ul>
        <p className="mt-4">This doesn&apos;t affect your rights under the Consumer Protection Act. <Link href="/contact" className="text-gold-400 hover:text-gold-300">Contact us</Link> to start a return.</p>
      </section>
    </InfoPage>
  );
}
