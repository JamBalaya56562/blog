import { ArticleCard } from "@/components/article-card"
import type { Post } from "@/lib/content/types"
import type { Locale } from "@/lib/i18n/config"

interface BentoGridProps {
  readonly locale: Locale
  readonly posts: Post[]
}

export function BentoGrid({ locale, posts }: Readonly<BentoGridProps>) {
  if (posts.length === 0) {
    return null
  }

  const gridPosts = posts.slice(0, 3)
  const [first, ...rest] = gridPosts

  const gridCols =
    gridPosts.length === 1
      ? "grid-cols-1"
      : gridPosts.length === 2
        ? "grid-cols-1 md:grid-cols-2"
        : "grid-cols-1 md:grid-cols-3"

  return (
    <section className="mx-auto max-w-7xl px-4">
      <div className={`grid gap-4 ${gridCols}`}>
        <ArticleCard post={first} locale={locale} isLarge />
        {rest.map((post) => (
          <ArticleCard
            key={post.slug}
            post={post}
            locale={locale}
            isLarge={false}
          />
        ))}
      </div>
    </section>
  )
}
