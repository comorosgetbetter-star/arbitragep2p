import { Skeleton } from '@/components/ui/skeleton';

export const DepositSkeleton = () => (
  <div className="space-y-4">
    {/* Crypto selector */}
    <div className="flex gap-2">
      {[...Array(3)].map((_, i) => (
        <Skeleton key={i} className="h-10 w-20 rounded-xl" />
      ))}
    </div>
    {/* Header */}
    <div className="text-center">
      <Skeleton className="w-14 h-14 rounded-2xl mx-auto mb-3" />
      <Skeleton className="h-5 w-28 mx-auto mb-1" />
      <Skeleton className="h-4 w-24 mx-auto" />
    </div>
    {/* Badge */}
    <div className="flex justify-center">
      <Skeleton className="h-5 w-28 rounded-full" />
    </div>
    {/* Address card */}
    <div className="rounded-xl border border-border p-4">
      <Skeleton className="h-3 w-24 mb-2" />
      <Skeleton className="h-5 w-full mb-1" />
      <Skeleton className="h-5 w-3/4" />
    </div>
    {/* Details */}
    <div className="rounded-xl border border-border p-4 space-y-3">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="flex justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
        </div>
      ))}
    </div>
  </div>
);
