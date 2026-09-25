import Image from "next/image"
import Link from "next/link"
import { ViewTransition } from "react"
import {
  DEFAULT_THUMBNAIL,
  estimateReadingTime,
} from "@/components/article-card"
import { TagLink } from "@/components/home/tag-link"
import { PostDate } from "@/components/post-date"
import { Brackets } from "@/components/ui/brackets"
import { PopularityBar, ViewStat } from "@/components/view-counts"
import type { Post } from "@/lib/content/types"
import type { Locale } from "@/lib/i18n/config"
import { formatCount } from "@/lib/i18n/format-number"
import { getBlogPostPath } from "@/lib/routes"

interface BlogListRowProps {
  readonly post: Post
  readonly locale: Locale
  readonly index: number
  readonly viewCount: number
  readonly viewMax: number
  readonly minReadLabel: string
  readonly minLabel: string
  readonly uncategorisedLabel: string
  readonly viewsLabel: string
  readonly activeTag?: string
}

/**
 * One post in the list: a card below 640px and a row from there up, from one
 * piece of markup. The breakpoint is the stylesheet's to decide, so the first
 * paint is already the right layout and nothing has to switch once scripts
 * run. The card's chrome sits on an inner box that becomes `display:
 * contents` on wider screens, which lets its children join the row's grid and
 * leaves the card's hover lift with no box to move.
 */
export function BlogListRow({
  post,
  locale,
  index,
  viewCount,
  viewMax,
  minReadLabel,
  minLabel,
  uncategorisedLabel,
  viewsLabel,
  activeTag,
}: Readonly<BlogListRowProps>) {
  const num = String(index + 1).padStart(3, "0")
  const cat = post.frontmatter.tags[0] ?? uncategorisedLabel
  const readMin = estimateReadingTime(post.content)
  return (
    <Link
      href={getBlogPostPath(locale, post.slug)}
      transitionTypes={["nav-forward"]}
      className="pp-list-row group relative block sm:grid sm:grid-cols-[56px_140px_1fr_auto] sm:items-center sm:gap-5 sm:px-3 sm:py-5 sm:transition-colors sm:hover:bg-cyber-bg-1/40"
    >
      <div className="pp-card-hover card-title-hover relative border border-cyber-line bg-cyber-bg-1/50 sm:contents">
        <span className="sm:hidden">
          <Brackets />
        </span>

        <span className="pp-num hidden text-base text-cyber-dim transition-colors group-hover:text-cyber-cyan sm:block">
          {num}
        </span>

        <div className="relative aspect-video overflow-hidden sm:w-full sm:border sm:border-cyber-line">
          <ViewTransition name={`post-image-${post.slug}`} share="morph">
            <Image
              src={post.frontmatter.image ?? DEFAULT_THUMBNAIL}
              alt=""
              width={1000}
              height={560}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03] sm:group-hover:scale-[1.04]"
            />
          </ViewTransition>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-cyber-bg-0/85 sm:hidden" />
          <span className="pp-tick pp-num absolute right-3 top-3 text-cyber-dim sm:hidden">
            NO.{num}
          </span>
          <span
            aria-hidden
            className="pp-card-sweep group-hover:opacity-100 group-hover:[animation:ppSweep_1.2s_linear_infinite] sm:hidden"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 hidden bg-gradient-to-t from-cyber-bg-0/60 to-transparent opacity-0 transition-opacity group-hover:opacity-100 sm:block"
          />
        </div>

        <div className="p-4 sm:min-w-0 sm:p-0">
          <div className="mb-1.5 hidden flex-wrap items-center gap-3 sm:flex">
            <span className="pp-tick text-cyber-amber/80 group-hover:text-cyber-amber">
              ◢ {cat.toUpperCase()}
            </span>
            <span className="pp-tick">
              <PostDate date={post.frontmatter.date} locale={locale} />
            </span>
          </div>
          <ViewTransition name={`post-title-${post.slug}`} share="morph">
            <h3 className="card-title pp-display text-foreground max-sm:text-base max-sm:leading-tight sm:truncate sm:text-lg sm:transition-all sm:group-hover:translate-x-2 sm:group-hover:text-cyber-cyan md:text-xl">
              <span className="pp-card-title">{post.frontmatter.title}</span>
            </h3>
          </ViewTransition>
          {post.frontmatter.description && (
            <p className="mt-2 line-clamp-2 font-mono text-xs leading-relaxed text-cyber-dim sm:hidden">
              {post.frontmatter.description}
            </p>
          )}
          {post.frontmatter.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5 sm:mt-2">
              {post.frontmatter.tags.map((t) => (
                <TagLink
                  key={t}
                  tag={t}
                  locale={locale}
                  className="pp-tag"
                  active={t === activeTag}
                />
              ))}
            </div>
          )}
          <ViewTransition name={`post-meta-${post.slug}`} share="morph">
            <div className="pp-tick mt-3 flex flex-wrap items-center justify-between gap-2 sm:hidden">
              <span>
                <PostDate date={post.frontmatter.date} locale={locale} />
              </span>
              <span className="flex gap-3">
                <span>
                  <span className="pp-num text-cyber-cyan">{readMin}</span>{" "}
                  {minLabel}
                </span>
                <span>
                  <ViewStat
                    slug={post.slug}
                    locale={locale}
                    fallback={viewCount}
                  />{" "}
                  {viewsLabel}
                </span>
              </span>
            </div>
          </ViewTransition>
        </div>

        <div className="hidden text-right sm:block">
          <div className="pp-num text-lg text-cyber-cyan">
            {formatCount(locale, viewCount)}
          </div>
          <div className="pp-tick">
            {readMin} {minReadLabel}
          </div>
        </div>

        <div className="pp-bar sm:hidden">
          <PopularityBar
            slug={post.slug}
            fallback={viewCount}
            fallbackMax={viewMax}
          />
        </div>
      </div>
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 hidden w-0.5 bg-cyber-cyan opacity-0 shadow-[0_0_8px_var(--cyber-cyan)] transition-opacity group-hover:opacity-100 sm:block"
      />
    </Link>
  )
}
