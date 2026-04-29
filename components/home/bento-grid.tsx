import { ArticleCard } from "@/components/article-card"
import type { Post } from "@/lib/content/types"
import type { Locale } from "@/lib/i18n/config"
import type { Dictionary } from "@/lib/i18n/get-dictionary"

interface BentoGridProps {
  readonly locale: Locale
  readonly posts: Post[]
  readonly viewCounts?: Map<string, number>
  readonly dictionary: Dictionary
}

export function BentoGrid({
  locale,
  posts,
  viewCounts,
  dictionary,
}: Readonly<BentoGridProps>) {
  if (posts.length === 0) {
    return null
  }

  const gridPosts = posts.slice(0, 3)
  const [first, ...rest] = gridPosts
  const counts = gridPosts.map((p) => viewCounts?.get(p.slug) ?? 0)
  const viewMax = Math.max(...counts, 100)

  if (!first) {
    return null
  }

  const gridCols =
    gridPosts.length === 1
      ? "grid-cols-1"
      : gridPosts.length === 2
        ? "grid-cols-1 md:grid-cols-2"
        : "grid-cols-1 md:grid-cols-3"

  return (
    <section className="mx-auto max-w-7xl px-7 py-12">
      {/* Section header. On mobile we show only the compact `◢ PICKS` /
          `N ENTRIES` pair pinned to the row's outer edges — the long
          `featuredTitle` ("RECENT EXPERIMENTS") and the divider line
          would otherwise overflow narrow viewports. */}
      <div className="mb-6 flex items-baseline justify-between gap-4 sm:justify-start">
        <span className="pp-tick">◢ PICKS</span>
        <span className="pp-display hidden text-lg tracking-[0.04em] text-foreground sm:block sm:text-xl">
          {dictionary.home.featuredTitle}
        </span>
        <span aria-hidden className="hidden h-px flex-1 bg-cyber-line sm:block" />
        <span className="pp-tick">
          {posts.length} {dictionary.home.entriesShort}
        </span>
      </div>
      <div className={`grid gap-4 ${gridCols}`}>
        <ArticleCard
          post={first}
          locale={locale}
          isLarge
          index={0}
          viewMax={viewMax}
          viewCount={viewCounts?.get(first.slug)}
        />
        {rest.map((post, i) => (
          <ArticleCard
            key={post.slug}
            post={post}
            locale={locale}
            isLarge={false}
            index={i + 1}
            viewMax={viewMax}
            viewCount={viewCounts?.get(post.slug)}
          />
        ))}
      </div>
    </section>
  )
}
