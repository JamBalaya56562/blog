import Image from "next/image"
import Link from "next/link"
import { ViewTransition } from "react"
import { TagLink } from "@/components/home/tag-link"
import { Brackets } from "@/components/ui/brackets"
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
  readonly index?: number
  /**
   * Maximum view count among the cards in the same group, used to render the
   * popularity bar. Defaults to a reasonable floor so the bar is never empty.
   */
  readonly viewMax?: number
}

export function ArticleCard({
  post,
  locale,
  isLarge = false,
  viewCount,
  index,
  viewMax,
}: Readonly<ArticleCardProps>) {
  const readMin = estimateReadingTime(post.content)
  const numberLabel =
    typeof index === "number" ? String(index + 1).padStart(3, "0") : null
  const category = post.frontmatter.tags[0]?.toUpperCase() ?? "DISPATCH"

  const max = Math.max(viewMax ?? 0, viewCount ?? 0, 100)
  const popularity = Math.min(
    1,
    Math.max(0.05, (viewCount ?? 0) / Math.max(1, max)),
  )

  return (
    <Link
      href={getBlogPostPath(locale, post.slug)}
      className={`pp-card-hover card-title-hover group relative block border border-cyber-line bg-cyber-bg-1/50 transition-colors ${
        isLarge ? "md:col-span-2" : ""
      }`}
    >
      <Brackets />

      <div
        className={`relative overflow-hidden ${isLarge ? "aspect-[16/9]" : "aspect-video"}`}
      >
        <ViewTransition name={`post-image-${post.slug}`} share="morph">
          <Image
            src={post.frontmatter.image ?? DEFAULT_THUMBNAIL}
            alt={post.frontmatter.title}
            width={1000}
            height={560}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        </ViewTransition>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-cyber-bg-0/85" />
        <span className="pp-tick absolute left-3 top-3 border border-cyber-cyan/60 bg-cyber-bg-0/60 px-1.5 py-0.5 text-cyber-cyan">
          {category}
        </span>
        {numberLabel && (
          <span className="pp-tick pp-num absolute right-3 top-3 text-cyber-dim">
            NO.{numberLabel}
          </span>
        )}
        {/* Scan-line: a 1px cyan beam that sweeps top-to-bottom across the
            thumbnail while the card is hovered. Uses the shared `ppSweep`
            keyframe (top: -200px → 100%). prefers-reduced-motion disables
            the animation in globals.css. */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-[200px] h-px bg-cyber-cyan opacity-0 shadow-[0_0_12px_var(--cyber-cyan)] transition-opacity duration-200 group-hover:opacity-100 group-hover:[animation:ppSweep_1.2s_linear_infinite]"
        />
      </div>

      <div className="p-4">
        <ViewTransition name={`post-title-${post.slug}`} share="morph">
          <h3
            className={`card-title pp-display font-bold leading-tight text-foreground transition-colors ${
              isLarge ? "text-xl md:text-2xl" : "text-base"
            }`}
          >
            {post.frontmatter.title}
          </h3>
        </ViewTransition>
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
        <ViewTransition name={`post-meta-${post.slug}`} share="morph">
          <div className="pp-tick mt-3 flex flex-wrap items-center justify-between gap-2">
            <span>{post.frontmatter.date.replace(/-/g, ".")}</span>
            <span className="flex gap-3">
              <span>
                <span className="pp-num text-cyber-cyan">{readMin}</span> MIN
              </span>
              <span>
                <span className="pp-num text-cyber-cyan">
                  {(viewCount ?? 0).toLocaleString()}
                </span>{" "}
                VIEWS
              </span>
            </span>
          </div>
        </ViewTransition>
      </div>

      {/* Colourful popularity bar at the foot of the card. The base width
          tracks each post's view count (relative to the group max), and on
          hover it grows out to ~88% as a visual flourish — the gradient
          sweeps cyan → amber → magenta with a glowing white tip. */}
      <div className="pp-bar">
        <div
          className="pp-bar-fill group-hover:!w-[88%]"
          style={{ width: `${Math.max(popularity * 100, 18)}%` }}
        />
      </div>
    </Link>
  )
}
