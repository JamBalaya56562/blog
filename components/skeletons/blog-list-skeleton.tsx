import { ArticleCardSkeleton } from "@/components/skeletons/article-card-skeleton"
import { Skeleton } from "@/components/skeletons/skeleton-primitives"

const ROW_KEYS = ["a", "b", "c", "d", "e", "f"]

export function BlogListSkeleton() {
  return (
    <section className="px-7 py-12">
      {/* Page title */}
      <Skeleton className="h-12 w-32 sm:h-16 sm:w-40" />
      <Skeleton className="mt-3 h-3 w-64" />

      {/* Search + sort row */}
      <div className="mt-7 flex flex-wrap items-center gap-3">
        <Skeleton className="h-10 min-w-[260px] flex-1 sm:max-w-[380px]" />
        <Skeleton className="h-10 w-40" />
      </div>

      {/* Tag chips */}
      <div className="mt-5 flex flex-wrap gap-1.5">
        {["all", "ts", "react", "next", "css", "tw", "rust", "go"].map((k) => (
          <Skeleton key={k} className="h-5 w-16" />
        ))}
      </div>

      {/* Mobile: card grid */}
      <ul className="mt-8 flex flex-col gap-4 sm:hidden">
        {ROW_KEYS.slice(0, 3).map((k) => (
          <li key={k}>
            <ArticleCardSkeleton />
          </li>
        ))}
      </ul>

      {/* Desktop: numbered horizontal rows */}
      <ul className="mt-8 hidden flex-col sm:flex">
        {ROW_KEYS.map((k) => (
          <li key={k} className="border-t border-cyber-line last:border-b">
            <div className="grid grid-cols-[56px_140px_1fr_auto] items-center gap-5 px-3 py-5">
              <Skeleton className="h-5 w-10" />
              <Skeleton className="aspect-video w-full" />
              <div className="min-w-0 space-y-2">
                <div className="flex gap-3">
                  <Skeleton className="h-2 w-16" />
                  <Skeleton className="h-2 w-20" />
                </div>
                <Skeleton className="h-6 w-3/4 max-w-md" />
                <div className="mt-1 flex gap-2">
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-4 w-14" />
                </div>
              </div>
              <div className="space-y-2 text-right">
                <Skeleton className="ml-auto h-5 w-14" />
                <Skeleton className="ml-auto h-2 w-16" />
              </div>
            </div>
          </li>
        ))}
      </ul>

      {/* Pagination */}
      <div className="mt-12 flex flex-wrap items-center justify-center gap-1 border-t border-cyber-line pt-6">
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 w-9" />
        <Skeleton className="h-9 w-9" />
        <Skeleton className="h-9 w-9" />
        <Skeleton className="h-9 w-16" />
      </div>
    </section>
  )
}
