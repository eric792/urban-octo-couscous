import { ShieldCheck, Star, Truck } from "lucide-react";
import { formatZAR } from "@/lib/utils";

export function ValueProps({ freeShippingThreshold, rating }: { freeShippingThreshold: number; rating: number | null }) {
  const items = [
    {
      Icon: Truck,
      title: "Nationwide Delivery",
      text:
        freeShippingThreshold > 0
          ? `Pargo pickup or door delivery to all 9 provinces. Free over ${formatZAR(freeShippingThreshold)}.`
          : "Pargo pickup or door delivery to all 9 provinces.",
    },
    { Icon: ShieldCheck, title: "Secure Local Payments", text: "Card, Instant EFT and more — powered by Yoco & Payfast." },
    {
      Icon: Star,
      title: "100% Satisfaction",
      text: rating ? `Rated ${rating.toFixed(1)}/5 by verified customers.` : "Loved by customers across South Africa.",
    },
  ];
  return (
    <section className="border-y border-ink-500/60 bg-ink-800/40 py-12">
      <div className="container-luxe grid grid-cols-1 gap-6 md:grid-cols-3">
        {items.map(({ Icon, title, text }) => (
          <div key={title} className="flex items-center gap-4 p-4">
            <div className="rounded-full border border-gold-500/20 bg-gold-500/10 p-3 text-gold-400">
              <Icon className="h-6 w-6" strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="font-medium tracking-wide text-white">{title}</h3>
              <p className="text-sm text-zinc-400">{text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
