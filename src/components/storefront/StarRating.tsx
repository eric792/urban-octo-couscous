import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function StarRating({ rating, className, size = "h-3.5 w-3.5" }: { rating: number; className?: string; size?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} aria-label={`${rating.toFixed(1)} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={cn(size, n <= Math.round(rating) ? "fill-gold-400 text-gold-400" : "fill-transparent text-ink-500")}
          strokeWidth={1.5}
        />
      ))}
    </span>
  );
}
