import Image from "next/image"
import Link from "next/link"
import { ViewTransition } from "react"
import { TagLink } from "@/components/home/tag-link"
import { Brackets } from "@/components/ui/brackets"
import { PopularityBar, ViewStat } from "@/components/view-counts"
import type { Post } from "@/lib/content/types"
import type { Locale } from "@/lib/i18n/config"
import { getBlogPostPath } from "@/lib/routes"

export const DEFAULT_THUMBNAIL = "/thumbnail_default.png"

/**
 * Names an element so it can morph into its counterpart on the destination
 * page, or renders it plainly when `enabled` is false.
 *
 * The opt-out exists for cards that sit on a post page. A name only pairs
 * when the same name exists on both sides, so a related-dispatch card naming
 * the post you are about to open pairs with that post's hero — and the hero
 * then flies in from the card's position at the foot of the page. Measured on
 * a previous/next navigation that was a 352px drop with a 3.5x scale, which
 * buries the directional slide the navigation is supposed to read as.
 */
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
  /**
   * Maximum view count among the cards in the same group, used to render the
   * popularity bar. Defaults to a reasonable floor so the bar is never empty.
   */
  readonly viewMax?: number
  /**
   * Whether this card's image, title and date may morph into the post page.
   * On by default — it is what makes a card grow into the article you just
   * opened. Turn it off for cards rendered *on* a post page, where the name
   * would pair with that page's own hero.
   */
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
    // `self-start` keeps the card at its own content height. Grid items stretch
    // to the tallest card in the row by default, which left the popularity bar
    // stranded mid-card on the shorter ones, with empty space and a border
    // below it. The bar marks the bottom edge, so the edge has to meet it.
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
        {/* Scan-line: a 1px cyan beam that sweeps top-to-bottom across the
            thumbnail while the card is hovered. Uses the shared `ppSweep`
            keyframe (top: -200px → 100%). `.pp-card-sweep` carries the
            appearance and is the hook the reduced-motion block in
            globals.css switches the animation off through. */}
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
            <span>{post.frontmatter.date.replace(/-/g, ".")}</span>
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

      {/* Colourful popularity bar at the foot of the card. The base width
          tracks each post's view count (relative to the group max), and on
          hover it grows out to ~88% as a visual flourish — the gradient
          sweeps cyan → amber → magenta with a glowing white tip. */}
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
