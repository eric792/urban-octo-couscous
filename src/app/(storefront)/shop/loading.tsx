import { LoadingLabel, ProductGridSkeleton, Skeleton } from "@/components/ui/Skeleton";

export default function ShopLoading() {
  return (
    <div className="container-luxe py-14">
      <LoadingLabel label="Loading products" />
      <Skeleton className="h-3 w-40" />
      <Skeleton className="mt-6 h-14 w-80 max-w-full" />
      <Skeleton className="mt-4 h-4 w-full max-w-xl" />
      <div className="mt-12 grid gap-12 lg:grid-cols-[220px_1fr]">
        <div className="hidden space-y-4 lg:block">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className="h-4 w-3/4" />
          ))}
        </div>
        <div>
          <Skeleton className="mb-8 h-10 w-full" />
          <ProductGridSkeleton />
        </div>
      </div>
    </div>
  );
}
