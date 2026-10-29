import { LoadingLabel, Skeleton } from "@/components/ui/Skeleton";

// Shown while any storefront page without its own loading state streams in.
export default function StorefrontLoading() {
  return (
    <div className="container-luxe py-16">
      <LoadingLabel />
      <Skeleton className="h-3 w-32" />
      <Skeleton className="mt-6 h-12 w-2/3 max-w-xl" />
      <Skeleton className="mt-4 h-4 w-1/2 max-w-md" />
      <div className="mt-14 grid gap-6 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="aspect-[4/5] w-full" />
        ))}
      </div>
    </div>
  );
}
