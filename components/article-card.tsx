import Image from "next/image"
import Link from "next/link"
import { ViewTransition } from "react"
import { TagLink } from "@/components/home/tag-link"
import { PostDate } from "@/components/post-date"
import { Brackets } from "@/components/ui/brackets"
import { PopularityBar, ViewStat } from "@/components/view-counts"
import type { Post } from "@/lib/content/types"
import type { Locale } from "@/lib/i18n/config"
import { getBlogPostPath } from "@/lib/routes"

export const DEFAULT_THUMBNAIL = "/thumbnail_default.png"

function Morph({
  name,
  enabled,
  children,
}: Readonly<{ name: string; enabled: boolean; children: React.ReactNode }>) {
  if (!enabled) {
    return children
  }
  return (
    <ViewTransition name={name} share="morph">
      {children}
    </ViewTransition>
  )
}

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
  readonly index?: number
  readonly viewMax?: number
  readonly morph?: boolean
}

export function ArticleCard({
  post,
  locale,
  isLarge = false,
  viewCount,
  index,
  viewMax,
  morph = true,
}: Readonly<ArticleCardProps>) {
  const readMin = estimateReadingTime(post.content)
  const numberLabel =
    typeof index === "number" ? String(index + 1).padStart(3, "0") : null
  const category = post.frontmatter.tags[0]?.toUpperCase() ?? "DISPATCH"

  return (
    <Link
      href={getBlogPostPath(locale, post.slug)}
      transitionTypes={["nav-forward"]}
      className={`pp-card-hover card-title-hover group relative block self-start border border-cyber-line bg-cyber-bg-1/50 ${
        isLarge ? "md:col-span-2" : ""
      }`}
    >
      <Brackets />

      <div
        className={`relative overflow-hidden ${isLarge ? "aspect-[16/9]" : "aspect-video"}`}
      >
        <Morph enabled={morph} name={`post-image-${post.slug}`}>
          <Image
            src={post.frontmatter.image ?? DEFAULT_THUMBNAIL}
            alt={post.frontmatter.title}
            width={1000}
            height={560}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        </Morph>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-cyber-bg-0/85" />
        <span className="pp-tick absolute left-3 top-3 border border-cyber-cyan/60 bg-cyber-bg-0/60 px-1.5 py-0.5 text-cyber-cyan">
          {category}
        </span>
        {numberLabel && (
          <span className="pp-tick pp-num absolute right-3 top-3 text-cyber-dim">
            NO.{numberLabel}
          </span>
        )}
        <span
          aria-hidden
          className="pp-card-sweep group-hover:opacity-100 group-hover:[animation:ppSweep_1.2s_linear_infinite]"
        />
      </div>

      <div className="p-4">
        <Morph enabled={morph} name={`post-title-${post.slug}`}>
          <h3
            className={`card-title pp-display font-bold leading-tight text-foreground transition-colors ${
              isLarge ? "text-xl md:text-2xl" : "text-base"
            }`}
          >
            {post.frontmatter.title}
          </h3>
        </Morph>
        {post.frontmatter.description && (
          <p className="mt-2 line-clamp-2 font-mono text-xs leading-relaxed text-cyber-dim">
            {post.frontmatter.description}
          </p>
        )}
        {post.frontmatter.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {post.frontmatter.tags.map((tag) => (
              <TagLink key={tag} tag={tag} locale={locale} className="pp-tag" />
            ))}
          </div>
        )}
        <Morph enabled={morph} name={`post-meta-${post.slug}`}>
          <div className="pp-tick mt-3 flex flex-wrap items-center justify-between gap-2">
            <span>
              <PostDate date={post.frontmatter.date} locale={locale} />
            </span>
            <span className="flex gap-3">
              <span>
                <span className="pp-num text-cyber-cyan">{readMin}</span> MIN
              </span>
              <span>
                <ViewStat slug={post.slug} fallback={viewCount} /> VIEWS
              </span>
            </span>
          </div>
        </Morph>
      </div>

      <div className="pp-bar">
        <PopularityBar
          slug={post.slug}
          fallback={viewCount}
          fallbackMax={viewMax}
        />
      </div>
    </Link>
  )
}
