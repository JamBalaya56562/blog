import { ArticleCardSkeleton } from "@/components/skeletons/article-card-skeleton"
import { Skeleton } from "@/components/skeletons/skeleton-primitives"

export function BlogPostSkeleton() {
  return (
    <div className="mx-auto max-w-3xl">
      <article>
        <header className="mb-8">
          <Skeleton className="h-10 w-3/4" />
          <div className="mt-2 flex flex-wrap items-center gap-x-3">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="mt-2 flex gap-2">
            <Skeleton className="h-5 w-14 rounded" />
            <Skeleton className="h-5 w-18 rounded" />
            <Skeleton className="h-5 w-12 rounded" />
          </div>
        </header>
        <Skeleton className="mb-12 aspect-[21/9] w-full rounded-xl" />
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-11/12" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="mt-6 h-6 w-1/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-10/12" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="mt-6 h-6 w-2/5" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </article>
      <section className="mt-16">
        <Skeleton className="mb-6 h-7 w-48" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <ArticleCardSkeleton />
          <ArticleCardSkeleton />
          <ArticleCardSkeleton />
        </div>
      </section>
      <nav className="mt-12 flex flex-col gap-4 sm:flex-row">
        <Skeleton className="h-20 flex-1 rounded" />
        <Skeleton className="h-20 flex-1 rounded" />
      </nav>
    </div>
  )
}
