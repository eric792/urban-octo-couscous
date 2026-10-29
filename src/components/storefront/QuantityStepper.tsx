"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export function QuantityStepper({
  value,
  onChange,
  max = 20,
  size = "md",
}: {
  value: number;
  onChange: (value: number) => void;
  max?: number;
  size?: "sm" | "md";
}) {
  const btn = cn(
    "flex items-center justify-center text-zinc-400 transition hover:text-gold-300 disabled:opacity-30",
    size === "sm" ? "h-8 w-8" : "h-11 w-11",
  );
  return (
    <div className="inline-flex items-center border border-ink-500 bg-ink-800">
      <button type="button" className={btn} onClick={() => onChange(value - 1)} aria-label="Decrease quantity">
        <Minus className="h-3.5 w-3.5" />
      </button>
      <span className={cn("min-w-8 text-center tabular-nums text-zinc-100", size === "sm" ? "text-sm" : "text-base")}>
        {value}
      </span>
      <button
        type="button"
        className={btn}
        onClick={() => onChange(value + 1)}
        disabled={value >= max}
        aria-label="Increase quantity"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
