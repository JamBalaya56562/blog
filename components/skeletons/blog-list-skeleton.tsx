import { ArticleCardSkeleton } from "@/components/skeletons/article-card-skeleton"
import { Skeleton } from "@/components/skeletons/skeleton-primitives"

export function BlogListSkeleton() {
  return (
    <div>
      <Skeleton className="mb-6 h-9 w-48" />
      <Skeleton className="mb-4 h-5 w-64" />
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {Array.from({ length: 6 }, (_, i) => (
          <ArticleCardSkeleton key={i} />
        ))}
      </div>
      <div className="mt-8 flex items-center justify-center gap-2">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-10 w-10 rounded-lg" />
        ))}
      </div>
    </div>
  )
}
