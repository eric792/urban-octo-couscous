import { LoadingLabel, Skeleton } from "@/components/ui/Skeleton";

export default function ProductLoading() {
  return (
    <div className="container-luxe py-10">
      <LoadingLabel label="Loading product" />
      <Skeleton className="h-3 w-56" />
      <div className="mt-8 grid gap-12 lg:grid-cols-2 lg:gap-16">
        <Skeleton className="aspect-[4/5] w-full" />
        <div className="space-y-5 lg:py-4">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-14 w-3/4" />
          <Skeleton className="h-5 w-1/2" />
          <Skeleton className="mt-8 h-10 w-40" />
          <div className="flex gap-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-16 w-24" />
            ))}
          </div>
          <Skeleton className="h-14 w-full" />
          <div className="grid grid-cols-3 gap-3 pt-4">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
