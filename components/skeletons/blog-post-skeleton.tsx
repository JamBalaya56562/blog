import { ArticleCardSkeleton } from "@/components/skeletons/article-card-skeleton"
import { Brackets } from "@/components/ui/brackets"
import { Skeleton } from "@/components/skeletons/skeleton-primitives"

function RelatedPostsSkeleton() {
  return (
    <section className="relative mt-16 border border-cyber-line bg-cyber-bg-1/40 p-6">
      <Brackets color="amber" />
      <Skeleton className="mb-5 h-3 w-56" />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <ArticleCardSkeleton />
        <ArticleCardSkeleton />
        <ArticleCardSkeleton />
      </div>
    </section>
  )
}

function PostNavigationSkeleton() {
  return (
    <nav className="mt-12 flex flex-col gap-4 sm:flex-row sm:justify-between">
      <div className="relative flex flex-1 flex-col gap-2 border border-cyber-line bg-cyber-bg-1/40 p-4">
        <Brackets />
        <Skeleton className="h-2 w-24" />
        <Skeleton className="h-5 w-3/4" />
      </div>
      <div className="relative flex flex-1 flex-col items-end gap-2 border border-cyber-line bg-cyber-bg-1/40 p-4 text-right">
        <Brackets />
        <Skeleton className="h-2 w-24" />
        <Skeleton className="h-5 w-3/4" />
      </div>
    </nav>
  )
}

export function BlogPostSkeleton() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <article>
        <header className="mb-10">
          <Skeleton className="h-10 w-full md:h-12 md:w-4/5" />
          <Skeleton className="mt-3 h-10 w-3/5 md:hidden" />
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Skeleton className="h-2 w-32" />
            <Skeleton className="h-2 w-20" />
            <Skeleton className="h-2 w-24" />
          </div>
          <div className="mt-3 flex gap-2">
            <Skeleton className="h-4 w-14" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-12" />
          </div>
        </header>
        {/* Hero image with corner brackets */}
        <div className="relative mb-12 aspect-[21/9] overflow-hidden border border-cyber-line">
          <Brackets />
          <Skeleton className="h-full w-full border-0" />
        </div>
        {/* Body */}
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="mt-6 h-7 w-48" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="mt-6 h-7 w-40" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </article>
      <RelatedPostsSkeleton />
      <PostNavigationSkeleton />
    </div>
  )
}
