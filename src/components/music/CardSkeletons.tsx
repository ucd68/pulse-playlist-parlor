import { Skeleton } from "@/components/ui/skeleton";

export function CardSkeletons({ count = 6 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="w-36 shrink-0 p-2.5 sm:w-44 md:w-auto">
          <Skeleton className="aspect-square w-full rounded-lg bg-surface" />
          <Skeleton className="mt-3 h-4 w-3/4 bg-surface" />
          <Skeleton className="mt-2 h-3 w-1/2 bg-surface" />
        </div>
      ))}
    </>
  );
}

export function RowSkeletons({ count = 6 }: { count?: number }) {
  return (
    <div className="space-y-1">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex items-center gap-3 px-2 py-2 md:px-4">
          <Skeleton className="h-11 w-11 bg-surface" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-2/5 bg-surface" />
            <Skeleton className="h-3 w-1/4 bg-surface" />
          </div>
        </div>
      ))}
    </div>
  );
}
