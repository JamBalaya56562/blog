import { ArticleCard } from "@/components/article-card"
import type { Post } from "@/lib/content/types"
import type { Locale } from "@/lib/i18n/config"
import type { Dictionary } from "@/lib/i18n/get-dictionary"

interface RelatedPostsProps {
  readonly locale: Locale
  readonly posts: Post[]
  readonly dictionary: Dictionary
}

export function RelatedPosts({
  locale,
  posts,
  dictionary,
}: Readonly<RelatedPostsProps>): JSX.Element | null {
  if (posts.length === 0) {
    return null
  }

  return (
    <section>
      <h2 className="mb-6 font-headline text-2xl font-bold text-on-surface">
        {dictionary.blog.continueExploring}
      </h2>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {posts.map((post) => (
          <ArticleCard key={post.slug} post={post} locale={locale} />
        ))}
      </div>
    </section>
  )
}
