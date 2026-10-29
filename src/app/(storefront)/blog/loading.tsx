import { LoadingLabel, Skeleton } from "@/components/ui/Skeleton";

export default function BlogLoading() {
  return (
    <div className="container-luxe py-16">
      <LoadingLabel label="Loading the journal" />
      <Skeleton className="h-3 w-28" />
      <Skeleton className="mt-5 h-14 w-96 max-w-full" />
      <div className="mt-14 grid items-center gap-10 lg:grid-cols-2">
        <Skeleton className="aspect-[16/9] w-full" />
        <div className="space-y-4">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </div>
    </div>
  );
}
