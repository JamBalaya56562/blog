import Image from "next/image"
import Link from "next/link"
import type { Post } from "@/lib/content/types"
import type { Locale } from "@/lib/i18n/config"
import { getBlogPostPath } from "@/lib/routes"

const DEFAULT_THUMBNAIL = "/thumbnail_default.png"

function estimateReadingTime(content: string): number {
  const charCount = content.length
  const wordCount = content.split(/\s+/).length
  const jaMinutes = charCount / 400
  const enMinutes = wordCount / 200
  return Math.max(1, Math.round(Math.min(jaMinutes, enMinutes)))
}

interface BentoGridProps {
  readonly locale: Locale
  readonly posts: Post[]
}

function ArticleCard({
  post,
  locale,
  isLarge,
}: {
  readonly post: Post
  readonly locale: Locale
  readonly isLarge: boolean
}) {
  const readMin = estimateReadingTime(post.content)

  return (
    <Link
      href={getBlogPostPath(locale, post.slug)}
      className={`group relative block overflow-hidden rounded-2xl bg-surface-container-lowest transition-colors ${isLarge ? "md:col-span-2" : ""}`}
    >
      <div className="absolute inset-y-0 left-0 w-1 rounded-l-2xl bg-primary-fixed opacity-0 transition-opacity group-hover:opacity-100" />
      <Image
        src={post.frontmatter.image ?? DEFAULT_THUMBNAIL}
        alt={post.frontmatter.title}
        width={800}
        height={400}
        className={`w-full object-cover ${isLarge ? "h-40 md:h-48" : "h-40"}`}
      />
      <div className="p-4">
        <h3
          className={`font-headline font-bold leading-tight text-on-surface transition-colors group-hover:text-on-primary-container text-lg ${isLarge ? "md:text-2xl" : ""}`}
        >
          {post.frontmatter.title}
        </h3>
        {post.frontmatter.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {post.frontmatter.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-secondary-container px-2 py-0.5 text-[10px] font-medium text-on-secondary-container"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        <div className="mt-2 flex items-center gap-3 text-xs text-on-surface-variant">
          <span>{post.frontmatter.date}</span>
          <span>·</span>
          <span>{readMin} min read</span>
        </div>
      </div>
    </Link>
  )
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
