import { Skeleton } from '@/components/ui/skeleton';

export const PortfolioSkeleton = () => (
  <div className="mb-6">
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
);
