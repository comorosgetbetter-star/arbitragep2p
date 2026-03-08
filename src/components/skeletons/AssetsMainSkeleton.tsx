import { Skeleton } from '@/components/ui/skeleton';

export const AssetsMainSkeleton = () => (
  <div className="space-y-5">
    {/* Balance */}
    <div>
      <div className="flex items-center gap-2 mb-1">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4 rounded-full" />
      </div>
      <div className="flex items-baseline gap-2">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-5 w-10" />
      </div>
      <Skeleton className="h-4 w-40 mt-1" />
    </div>

    {/* Action buttons */}
    <div className="grid grid-cols-4 gap-3">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="flex flex-col items-center gap-1.5">
          <Skeleton className="w-12 h-12 rounded-full" />
          <Skeleton className="h-3 w-12" />
        </div>
      ))}
    </div>

    {/* Promo card */}
    <Skeleton className="h-16 w-full rounded-2xl" />

    {/* Assets list */}
    <div className="space-y-1">
      <Skeleton className="h-5 w-20 mb-3" />
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center justify-between py-3 px-1">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-full" />
            <div>
              <Skeleton className="h-4 w-16 mb-1" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <div className="text-right">
            <Skeleton className="h-4 w-20 mb-1" />
            <Skeleton className="h-3 w-14 ml-auto" />
          </div>
        </div>
      ))}
    </div>
  </div>
);
