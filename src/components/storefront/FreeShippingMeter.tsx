import { Truck } from "lucide-react";
import { formatZAR } from "@/lib/utils";

export function FreeShippingMeter({ subtotal, threshold }: { subtotal: number; threshold: number }) {
  if (threshold <= 0) return null;
  const remaining = Math.max(threshold - subtotal, 0);
  const pct = Math.min((subtotal / threshold) * 100, 100);
  return (
    <div className="space-y-2">
      <p className="flex items-center gap-2 text-xs text-zinc-400">
        <Truck className="h-4 w-4 text-gold-400" />
        {remaining > 0 ? (
          <span>
            You&apos;re <span className="text-gold-300">{formatZAR(remaining)}</span> away from free delivery
          </span>
        ) : (
          <span className="text-gold-300">You&apos;ve unlocked free nationwide delivery</span>
        )}
      </p>
      <div className="h-1 w-full overflow-hidden bg-ink-600">
        <div className="h-full bg-gradient-to-r from-gold-600 to-gold-300 transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
