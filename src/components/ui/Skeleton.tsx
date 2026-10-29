import { cn } from "@/lib/utils";

export function Skeleton({ className, tone = "store" }: { className?: string; tone?: "store" | "admin" }) {
  return <div aria-hidden="true" className={cn("animate-pulse rounded-sm", tone === "store" ? "bg-ink-700/70" : "bg-zinc-800/70", className)} />;
}

/** Product grid placeholder shared by the shop and category pages. */
export function ProductGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-5 gap-y-12 xl:grid-cols-3">
      {Array.from({ length: count }, (_, i) => (
        <div key={i}>
          <Skeleton className="aspect-[4/5] w-full" />
          <Skeleton className="mt-4 h-2.5 w-16" />
          <Skeleton className="mt-3 h-5 w-3/4" />
          <Skeleton className="mt-2 h-4 w-1/2" />
        </div>
      ))}
    </div>
  );
}

/** Screen-reader announcement for loading regions. */
export function LoadingLabel({ label = "Loading" }: { label?: string }) {
  return (
    <span role="status" className="sr-only">
      {label}…
    </span>
  );
}
