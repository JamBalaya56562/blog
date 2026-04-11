import { ArticleCardSkeleton } from "@/components/skeletons/article-card-skeleton"
import { Skeleton } from "@/components/skeletons/skeleton-primitives"

function HeroSkeleton() {
  return (
    <section className="flex min-h-[35vh] items-center justify-center">
      <div className="mx-auto max-w-7xl px-2 py-6 text-center md:px-4 md:py-10">
        <div className="mb-8 flex items-center justify-center gap-2 md:gap-3">
          <Skeleton className="h-7 w-32 rounded-full md:h-8 md:w-40" />
          <Skeleton className="h-7 w-28 rounded-full md:h-8 md:w-36" />
        </div>
        <div className="mx-auto max-w-4xl space-y-3">
          <Skeleton className="mx-auto h-9 w-4/5 md:h-16" />
          <Skeleton className="mx-auto h-9 w-3/5 md:h-16" />
        </div>
        <div className="mx-auto mt-6 max-w-2xl space-y-2">
          <Skeleton className="mx-auto h-4 w-4/5 md:h-5" />
          <Skeleton className="mx-auto h-4 w-3/5 md:h-5" />
        </div>
        <div className="mt-10 flex justify-center">
          <Skeleton className="h-12 w-40 rounded-lg" />
        </div>
      </div>
    </section>
  )
}

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
        {Array.from({ length: 5 }, (_, i) => (
          <div
            key={i}
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

export function HomeSkeleton() {
  return (
    <div className="relative">
      <HeroSkeleton />
      <div className="py-20">
        <BentoGridSkeleton />
      </div>
      <RecentDispatchesSkeleton />
    </div>
  )
}
