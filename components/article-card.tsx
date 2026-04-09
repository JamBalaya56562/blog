import Image from "next/image"
import Link from "next/link"
import { ViewTransition } from "react"
import { TagLink } from "@/components/home/tag-link"
import type { Post } from "@/lib/content/types"
import type { Locale } from "@/lib/i18n/config"
import { getBlogPostPath } from "@/lib/routes"

export const DEFAULT_THUMBNAIL = "/thumbnail_default.png"

export function estimateReadingTime(content: string): number {
  const charCount = content.length
  const wordCount = content.split(/\s+/).length
  const jaMinutes = charCount / 400
  const enMinutes = wordCount / 200
  return Math.max(1, Math.round(Math.min(jaMinutes, enMinutes)))
}

interface ArticleCardProps {
  readonly post: Post
  readonly locale: Locale
  readonly isLarge?: boolean
  readonly viewCount?: number
}

export function ArticleCard({
  post,
  locale,
  isLarge = false,
  viewCount,
}: Readonly<ArticleCardProps>) {
  const readMin = estimateReadingTime(post.content)

  return (
    <Link
      href={getBlogPostPath(locale, post.slug)}
      className={`card-title-hover group relative block overflow-hidden rounded-2xl bg-surface-container-lowest transition-colors ${isLarge ? "md:col-span-2" : ""}`}
    >
      <div className="absolute inset-y-0 left-0 w-1 rounded-l-2xl bg-primary-fixed opacity-0 transition-opacity group-hover:opacity-100" />
      <ViewTransition name={`post-image-${post.slug}`} share="morph">
        <Image
          src={post.frontmatter.image ?? DEFAULT_THUMBNAIL}
          alt={post.frontmatter.title}
          width={800}
          height={400}
          className={`w-full object-cover aspect-video rounded-xl transition-opacity hover:opacity-90 ${isLarge ? "md:max-h-56" : "md:max-h-40"}`}
        />
      </ViewTransition>
      <div className="p-4">
        <ViewTransition name={`post-title-${post.slug}`} share="morph">
          <h3
            className={`card-title font-headline font-bold leading-tight text-on-surface transition-colors text-lg ${isLarge ? "md:text-2xl" : ""}`}
          >
            {post.frontmatter.title}
          </h3>
        </ViewTransition>
        {post.frontmatter.description && (
          <p className="mt-1 text-sm text-on-surface-variant line-clamp-2">
            {post.frontmatter.description}
          </p>
        )}
        {post.frontmatter.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {post.frontmatter.tags.map((tag) => (
              <TagLink
                key={tag}
                tag={tag}
                locale={locale}
                className="cursor-pointer rounded-full bg-secondary-container px-2 py-0.5 text-[10px] font-medium text-on-secondary-container transition-colors hover:bg-primary hover:text-on-primary"
              />
            ))}
          </div>
        )}
        <ViewTransition name={`post-meta-${post.slug}`} share="morph">
          <div className="mt-2 flex flex-wrap items-center gap-x-3 text-xs text-on-surface-variant">
            <span className="basis-full md:basis-auto">
              {post.frontmatter.date}
            </span>
            <span className="hidden md:inline">·</span>
            <span>{readMin} min read</span>
            <span>·</span>
            <span>{(viewCount ?? 0).toLocaleString()} views</span>
          </div>
        </ViewTransition>
      </div>
    </Link>
  )
}
