import { Skeleton } from '@/components/ui/skeleton';

export const P2POrdersSkeleton = () => (
  <div className="space-y-3 max-w-2xl mx-auto">
    {[...Array(3)].map((_, i) => (
      <div key={i} className="rounded-xl border border-border p-4 sm:p-5 space-y-4">
        {/* Seller */}
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-4 w-32 mb-1" />
            <div className="flex gap-3">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-14" />
              <Skeleton className="h-3 w-10" />
            </div>
          </div>
        </div>
        {/* Details */}
        <div className="grid grid-cols-3 gap-3">
          {[...Array(3)].map((_, j) => (
            <div key={j}>
              <Skeleton className="h-2.5 w-16 mb-1" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
        {/* Buy section */}
        <div className="flex gap-2">
          <Skeleton className="flex-1 h-10 rounded-lg" />
          <Skeleton className="h-10 w-24 rounded-lg" />
        </div>
      </div>
    ))}
  </div>
);
