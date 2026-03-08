import { Skeleton } from '@/components/ui/skeleton';

export const BotsSkeleton = () => (
  <div className="space-y-4">
    {/* Balance card */}
    <div className="bg-card border border-border/50 rounded-2xl p-4 flex items-center gap-3">
      <Skeleton className="w-10 h-10 rounded-full" />
      <div>
        <Skeleton className="h-3 w-24 mb-1" />
        <Skeleton className="h-6 w-32" />
      </div>
    </div>

    <Skeleton className="h-5 w-28" />

    {/* Bot items */}
    {[...Array(5)].map((_, i) => (
      <div key={i} className="flex items-center gap-3.5 p-3.5 rounded-xl">
        <Skeleton className="w-11 h-11 rounded-full" />
        <div className="flex-1">
          <Skeleton className="h-4 w-28 mb-1" />
          <Skeleton className="h-3 w-full" />
        </div>
        <Skeleton className="h-4 w-4" />
      </div>
    ))}
  </div>
);
