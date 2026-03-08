import { Skeleton } from '@/components/ui/skeleton';

export const TradeSkeleton = () => (
  <div>
    {/* Header */}
    <div className="text-center mb-10">
      <Skeleton className="h-8 w-32 rounded-full mx-auto mb-4" />
      <Skeleton className="h-8 w-64 mx-auto mb-4" />
      <Skeleton className="h-4 w-full max-w-md mx-auto" />
    </div>

    {/* Calculator placeholder */}
    <Skeleton className="h-40 w-full rounded-xl mb-10" />

    {/* Package list */}
    <div className="flex flex-col gap-3 max-w-2xl mx-auto">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="rounded-xl border border-border py-4 px-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <Skeleton className="h-2.5 w-12 mb-1" />
                <Skeleton className="h-5 w-16" />
              </div>
              <div>
                <Skeleton className="h-2.5 w-12 mb-1" />
                <Skeleton className="h-5 w-24" />
              </div>
            </div>
            <Skeleton className="h-8 w-14 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  </div>
);
