export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-[16px] bg-ink/8 ${className}`} />
  );
}

export function SpotDetailSkeleton() {
  return (
    <div className="space-y-4">
      {/* カバー */}
      <div className="panel overflow-hidden">
        <Skeleton className="h-52 w-full rounded-none" />
        <div className="grid gap-8 px-6 py-8 sm:px-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-4">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-9 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
            <div className="flex gap-3 pt-2">
              <Skeleton className="h-8 w-24 rounded-full" />
              <Skeleton className="h-8 w-32 rounded-full" />
            </div>
          </div>
          <Skeleton className="min-h-[200px] rounded-[28px]" />
        </div>
      </div>
      {/* フィード */}
      <div className="panel px-6 py-8 sm:px-8">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-32 rounded-[20px]" />
            <Skeleton className="h-32 rounded-[20px]" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-32 rounded-[20px]" />
          </div>
        </div>
      </div>
    </div>
  );
}
