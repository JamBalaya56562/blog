import { Skeleton } from "@/components/skeletons/skeleton-primitives"

interface ArticleCardSkeletonProps {
  readonly isLarge?: boolean
}

export function ArticleCardSkeleton({
  isLarge = false,
}: ArticleCardSkeletonProps) {
  return (
    <div
      className={`overflow-hidden rounded-2xl bg-surface-container-lowest ${isLarge ? "md:col-span-2" : ""}`}
    >
      <Skeleton
        className={`aspect-video w-full rounded-xl ${isLarge ? "md:max-h-56" : "md:max-h-40"}`}
      />
      <div className="p-4">
        <Skeleton className={`h-5 w-3/4 ${isLarge ? "md:h-7 md:w-2/3" : ""}`} />
        <Skeleton className="mt-2 h-4 w-full" />
        <Skeleton className="mt-1 h-4 w-2/3" />
        <div className="mt-2 flex flex-wrap gap-1.5">
          <Skeleton className="h-5 w-12 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>
        <div className="mt-2 flex items-center gap-x-3">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-18" />
        </div>
      </div>
    </div>
  )
}
