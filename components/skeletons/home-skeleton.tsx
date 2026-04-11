import { ArticleCardSkeleton } from "@/components/skeletons/article-card-skeleton"
import { Skeleton } from "@/components/skeletons/skeleton-primitives"

function BentoGridSkeleton() {
  return (
    <section className="mx-auto max-w-5xl px-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <ArticleCardSkeleton isLarge />
        <ArticleCardSkeleton />
        <ArticleCardSkeleton />
      </div>
    </section>
  )
}

function RecentDispatchesSkeleton() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20">
      <div className="mb-12 flex items-end justify-between">
        <div className="max-w-xl space-y-3">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-5 w-80" />
        </div>
        <Skeleton className="hidden h-5 w-24 md:block" />
      </div>
      <div className="space-y-4">
        {["a", "b", "c", "d", "e"].map((key) => (
          <div
            key={key}
            className="flex flex-col justify-between rounded-xl bg-surface p-6 md:flex-row md:items-center"
          >
            <div className="flex items-center gap-8">
              <Skeleton className="hidden h-5 w-6 md:block" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-64 md:w-80" />
                <div className="flex gap-4">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-16 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export function HomeContentSkeleton() {
  return (
    <>
      <div className="py-20">
        <BentoGridSkeleton />
      </div>
      <RecentDispatchesSkeleton />
    </>
  )
}
