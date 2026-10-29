import { LoadingLabel, Skeleton } from "@/components/ui/Skeleton";

export default function AdminLoading() {
  return (
    <div>
      <LoadingLabel />
      <div className="mb-8 border-b border-zinc-800 pb-6">
        <Skeleton tone="admin" className="h-3 w-28" />
        <Skeleton tone="admin" className="mt-3 h-8 w-64" />
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} tone="admin" className="h-28 rounded-lg" />
        ))}
      </div>
      <div className="admin-card mt-6 divide-y divide-zinc-800">
        {Array.from({ length: 7 }, (_, i) => (
          <div key={i} className="flex items-center gap-6 px-6 py-4">
            <Skeleton tone="admin" className="h-4 w-24" />
            <Skeleton tone="admin" className="h-4 flex-1" />
            <Skeleton tone="admin" className="h-4 w-20" />
            <Skeleton tone="admin" className="h-5 w-24 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
