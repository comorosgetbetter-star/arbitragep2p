import { Skeleton } from '@/components/ui/skeleton';

export const CryptoGridSkeleton = () => (
  <div className="grid grid-cols-2 gap-3">
    {[...Array(6)].map((_, i) => (
      <div key={i} className="rounded-xl bg-card border border-border p-4">
        <div className="flex items-center gap-2 mb-2">
          <Skeleton className="h-5 w-5 rounded-full" />
          <Skeleton className="h-4 w-20" />
        </div>
        <Skeleton className="h-5 w-24 mb-1" />
        <Skeleton className="h-3 w-16" />
      </div>
    ))}
  </div>
);
