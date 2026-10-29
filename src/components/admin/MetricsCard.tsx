import { TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

export function MetricsCard({
  label,
  value,
  hint,
  change,
  Icon,
}: {
  label: string;
  value: string;
  hint?: string;
  change?: number | null;
  Icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="admin-card p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-wider text-zinc-500">{label}</p>
        {Icon && <Icon className="h-4 w-4 text-gold-500" />}
      </div>
      <p className="mt-3 font-serif text-3xl text-white">{value}</p>
      <div className="mt-1 flex items-center gap-2 text-xs">
        {change !== undefined && change !== null && (
          <span className={cn("inline-flex items-center gap-1 font-medium", change >= 0 ? "text-emerald-300" : "text-rose-300")}>
            {change >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
            {change >= 0 ? "+" : ""}
            {change.toFixed(0)}%
          </span>
        )}
        {hint && <span className="text-zinc-500">{hint}</span>}
      </div>
    </div>
  );
}
