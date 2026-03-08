import { Skeleton } from '@/components/ui/skeleton';

export const StakingSkeleton = () => (
  <div className="space-y-6">
    {/* Hero */}
    <div className="rounded-xl border border-border p-5">
      <div className="flex items-center gap-2 mb-2">
        <Skeleton className="w-8 h-8 rounded-lg" />
        <Skeleton className="h-5 w-32" />
      </div>
      <Skeleton className="h-4 w-full mb-3" />
      <div className="flex gap-4">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>

    {/* Balance */}
    <div className="rounded-xl border border-border p-4 flex items-center justify-between">
      <div>
        <Skeleton className="h-3 w-24 mb-1" />
        <Skeleton className="h-6 w-32" />
      </div>
      <Skeleton className="h-5 w-16 rounded-full" />
    </div>

    {/* Market ticker */}
    <div className="flex gap-2 overflow-hidden">
      {[...Array(4)].map((_, i) => (
        <Skeleton key={i} className="flex-shrink-0 rounded-xl h-16 w-[120px]" />
      ))}
    </div>

    {/* Plans */}
    {[...Array(3)].map((_, i) => (
      <div key={i} className="rounded-xl border border-border p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="w-9 h-9 rounded-xl" />
            <div>
              <Skeleton className="h-4 w-20 mb-1" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[...Array(3)].map((_, j) => (
            <Skeleton key={j} className="h-12 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-11 w-full rounded-lg" />
      </div>
    ))}
  </div>
);
