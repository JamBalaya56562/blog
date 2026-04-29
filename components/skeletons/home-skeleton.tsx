import { ArticleCardSkeleton } from "@/components/skeletons/article-card-skeleton"
import { Skeleton } from "@/components/skeletons/skeleton-primitives"

/** Hero section placeholder — large headline + subtitle + CTA + HUD strip. */
function HeroSkeleton() {
  return (
    <section className="relative overflow-hidden px-7 pb-12 pt-16 sm:pt-24">
      <Skeleton className="h-16 w-3/4 max-w-3xl sm:h-24" />
      <Skeleton className="mt-2 h-16 w-2/3 max-w-2xl sm:h-24" />
      <div className="mt-8 max-w-xl space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
      </div>
      <div className="mt-9 flex flex-wrap gap-3">
        <Skeleton className="h-10 w-44" />
        <Skeleton className="h-10 w-36" />
      </div>
      {/* HUD strip mirror */}
      <div className="mt-14 grid grid-cols-2 gap-0 border-t border-cyber-line md:grid-cols-3">
        <div className="border-b border-r border-cyber-line p-5 md:border-b-0">
          <Skeleton className="h-2 w-16" />
          <Skeleton className="mt-2 h-7 w-12" />
          <Skeleton className="mt-2 h-2 w-20" />
        </div>
        <div className="border-b border-cyber-line p-5 md:border-b-0 md:border-r">
          <Skeleton className="h-2 w-16" />
          <Skeleton className="mt-2 h-7 w-12" />
          <Skeleton className="mt-2 h-2 w-20" />
        </div>
        <div className="col-span-2 p-5 md:col-span-1">
          <Skeleton className="h-2 w-16" />
          <Skeleton className="mt-2 h-7 w-32" />
          <Skeleton className="mt-2 h-2 w-20" />
        </div>
      </div>
    </section>
  )
}

/** Bento (PICKS) section. */
function BentoGridSkeleton() {
  return (
    <section className="mx-auto max-w-7xl px-7 py-12">
      <div className="mb-6 flex items-baseline justify-between gap-4 sm:justify-start">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="hidden h-5 w-56 sm:block" />
        <span aria-hidden className="hidden h-px flex-1 bg-cyber-line sm:block" />
        <Skeleton className="h-3 w-20" />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <ArticleCardSkeleton isLarge />
        <ArticleCardSkeleton />
        <ArticleCardSkeleton />
      </div>
    </section>
  )
}

/** Recent dispatches numbered row list. */
function RecentDispatchesSkeleton() {
  return (
    <section className="mx-auto max-w-7xl px-7 py-16">
      <div className="mb-8 flex items-baseline gap-4">
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-7 w-56" />
        <span aria-hidden className="h-px flex-1 bg-cyber-line" />
        <Skeleton className="hidden h-3 w-20 sm:block" />
      </div>
      <ul className="flex flex-col">
        {["a", "b", "c", "d", "e"].map((key) => (
          <li key={key} className="border-t border-cyber-line last:border-b">
            <div className="grid grid-cols-[64px_1fr_auto] items-center gap-5 px-3 py-5">
              <Skeleton className="h-5 w-10" />
              <div className="min-w-0 space-y-2">
                <div className="flex gap-3">
                  <Skeleton className="h-2 w-16" />
                  <Skeleton className="h-2 w-20" />
                </div>
                <Skeleton className="h-5 w-3/4 max-w-md" />
                <div className="mt-1 flex gap-2">
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-4 w-14" />
                </div>
              </div>
              <div className="space-y-2 text-right">
                <Skeleton className="ml-auto h-4 w-12" />
                <Skeleton className="ml-auto h-2 w-16" />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

export function HomeContentSkeleton() {
  return (
    <>
      <HeroSkeleton />
      <BentoGridSkeleton />
      <RecentDispatchesSkeleton />
    </>
  )
}
