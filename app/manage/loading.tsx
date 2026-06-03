import { Skeleton } from "@/components/ui/skeleton";
export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl space-y-4 px-4 py-8">
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-48 rounded-[28px]" />
      <Skeleton className="h-48 rounded-[28px]" />
    </div>
  );
}
