import { cn } from "@/lib/utils";

const tones = {
  gold: "border-gold-500/30 bg-gold-500/10 text-gold-300",
  blue: "border-sky-500/30 bg-sky-500/10 text-sky-300",
  purple: "border-violet-500/30 bg-violet-500/10 text-violet-300",
  green: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  red: "border-rose-500/30 bg-rose-500/10 text-rose-300",
  zinc: "border-zinc-700 bg-zinc-800/60 text-zinc-300",
} as const;

export type BadgeTone = keyof typeof tones;

export function Badge({
  tone = "zinc",
  className,
  children,
}: {
  tone?: BadgeTone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-sans text-[11px] font-semibold uppercase tracking-wider",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
