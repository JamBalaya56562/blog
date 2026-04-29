import { Brackets } from "@/components/ui/brackets"
import { Skeleton } from "@/components/skeletons/skeleton-primitives"

interface ArticleCardSkeletonProps {
  readonly isLarge?: boolean
}

/**
 * Loading placeholder that mirrors the live `ArticleCard`: cyber-line
 * border, corner brackets, aspect-video thumbnail, padded body, and the
 * thin gradient bar at the foot of the card.
 */
export function ArticleCardSkeleton({
  isLarge = false,
}: ArticleCardSkeletonProps) {
  return (
    <div
      className={`relative border border-cyber-line bg-cyber-bg-1/40 ${isLarge ? "md:col-span-2" : ""}`}
    >
      <Brackets />
      <Skeleton className={`aspect-video w-full ${isLarge ? "md:aspect-[16/9]" : ""}`} />
      <div className="p-4">
        <Skeleton className={`h-5 w-3/4 ${isLarge ? "md:h-7 md:w-2/3" : ""}`} />
        <Skeleton className="mt-2 h-3 w-full" />
        <Skeleton className="mt-1 h-3 w-2/3" />
        <div className="mt-3 flex flex-wrap gap-1.5">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-14" />
        </div>
        <div className="mt-3 flex items-center justify-between gap-x-3">
          <Skeleton className="h-3 w-20" />
          <div className="flex gap-3">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      </div>
      {/* popularity bar placeholder */}
      <div className="h-1 bg-cyber-line" />
    </div>
  )
}
