import { Skeleton } from "@/components/ui/skeleton";
export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl space-y-4 px-4 py-8">
      <Skeleton className="h-8 w-40" />
      <div className="panel px-6 py-8 space-y-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-20 rounded-[20px]" />
        <Skeleton className="h-20 rounded-[20px]" />
      </div>
    </div>
  );
}
