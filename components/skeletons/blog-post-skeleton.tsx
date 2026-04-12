import { Skeleton } from "@/components/skeletons/skeleton-primitives"

function RelatedPostsSkeleton() {
  return (
    <section className="mt-12 border-t border-outline-variant pt-8">
      <Skeleton className="mb-4 h-7 w-36" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        {["a", "b", "c"].map((key) => (
          <div key={key} className="rounded-lg bg-surface-container-lowest p-4">
            <Skeleton className="mb-2 h-5 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="mt-1 h-4 w-1/2" />
          </div>
        ))}
      </div>
    </section>
  )
}

function PostNavigationSkeleton() {
  return (
    <nav className="mt-8 flex justify-between gap-4 border-t border-outline-variant pt-8">
      <Skeleton className="h-12 w-40 rounded-lg" />
      <Skeleton className="h-12 w-40 rounded-lg" />
    </nav>
  )
}

export function BlogPostSkeleton() {
  return (
    <div className="mx-auto max-w-3xl">
      <article>
        <header className="mb-8">
          <Skeleton className="h-10 w-full md:w-4/5" />
          <Skeleton className="mt-2 h-10 w-3/5 md:hidden" />
          <div className="mt-2 flex flex-wrap items-center gap-x-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="mt-2 flex gap-2">
            <Skeleton className="h-5 w-14 rounded-full" />
            <Skeleton className="h-5 w-18 rounded-full" />
            <Skeleton className="h-5 w-12 rounded-full" />
          </div>
        </header>
        <Skeleton className="mb-12 aspect-[21/9] w-full rounded-xl" />
        <div className="space-y-4">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-4/5" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="mt-6 h-7 w-48" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="mt-6 h-7 w-40" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-5/6" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-1/2" />
        </div>
      </article>
      <RelatedPostsSkeleton />
      <PostNavigationSkeleton />
    </div>
  )
}
