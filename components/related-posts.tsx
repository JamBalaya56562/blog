import { ArticleCard } from "@/components/article-card"
import { Brackets } from "@/components/ui/brackets"
import type { Post } from "@/lib/content/types"
import type { Locale } from "@/lib/i18n/config"
import type { Dictionary } from "@/lib/i18n/get-dictionary"

export function getRelatedPosts(allPosts: Post[], currentSlug: string): Post[] {
  return allPosts.filter((p) => p.slug !== currentSlug).slice(0, 3)
}

interface RelatedPostsProps {
  readonly locale: Locale
  readonly posts: Post[]
  readonly dictionary: Dictionary
  readonly viewCounts?: Map<string, number>
}

export function RelatedPosts({
  locale,
  posts,
  dictionary,
  viewCounts,
}: Readonly<RelatedPostsProps>): React.JSX.Element | null {
  if (posts.length === 0) {
    return null
  }

  return (
    <section className="relative mt-16 border border-cyber-line bg-cyber-bg-1/40 p-6">
      <Brackets color="amber" />
      <div className="pp-tick mb-5 text-cyber-amber">
        ◢ RELATED DISPATCHES — {dictionary.blog.continueExploring}
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {posts.map((post, i) => (
          <ArticleCard
            key={post.slug}
            post={post}
            locale={locale}
            index={i}
            viewCount={viewCounts?.get(post.slug)}
          />
        ))}
      </div>
    </section>
  )
}
