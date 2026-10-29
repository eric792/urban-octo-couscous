import { LoadingLabel, Skeleton } from "@/components/ui/Skeleton";

export default function PostLoading() {
  return (
    <div className="py-16">
      <LoadingLabel label="Loading story" />
      <div className="container-luxe flex max-w-3xl flex-col items-center gap-5">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-3 w-40" />
      </div>
      <div className="container-luxe mt-12 max-w-5xl">
        <Skeleton className="aspect-[16/9] w-full" />
      </div>
      <div className="container-luxe mt-12 max-w-2xl space-y-3">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </div>
    </div>
  );
}
