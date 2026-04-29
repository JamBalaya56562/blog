"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useState, ViewTransition } from "react"
import {
  ArticleCard,
  DEFAULT_THUMBNAIL,
  estimateReadingTime,
} from "@/components/article-card"
import { TagLink } from "@/components/home/tag-link"
import type { Post } from "@/lib/content/types"
import type { Locale } from "@/lib/i18n/config"
import { getBlogPostPath } from "@/lib/routes"

interface BlogListRowProps {
  readonly post: Post
  readonly locale: Locale
  readonly index: number
  readonly viewCount: number
  readonly viewMax: number
  readonly minReadLabel: string
  readonly activeTag?: string
}

const DESKTOP_QUERY = "(min-width: 640px)"

/**
 * Render exactly one of two layouts depending on viewport width:
 *   - mobile (< sm): the bento-style `ArticleCard` (image on top, body below)
 *   - sm+: a numbered horizontal row with thumbnail / title / view stats
 *
 * Both layouts wire `<ViewTransition>` to the same `post-image-${slug}` /
 * `post-title-${slug}` names so the morph to the post-detail page works on
 * either breakpoint. We can't ship both layouts in the SSR'd DOM at once
 * (React rejects duplicate ViewTransition names even when one branch is
 * `display: none`) — so this component picks one *exclusively* on the
 * client based on `matchMedia`.
 *
 * Hydration story: SSR + the very first client render always emit the
 * mobile card. After mount, a `useEffect` reads the actual viewport and
 * may swap to the desktop row on a single re-render. Desktop users see a
 * brief layout change on initial load — the price for keeping the
 * markup duplication-free.
 */
export function BlogListRow({
  post,
  locale,
  index,
  viewCount,
  viewMax,
  minReadLabel,
  activeTag,
}: Readonly<BlogListRowProps>) {
  const [isDesktop, setIsDesktop] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_QUERY)
    setIsDesktop(mq.matches)
    setMounted(true)
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches)
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])

  if (!mounted || !isDesktop) {
    return (
      <ArticleCard
        post={post}
        locale={locale}
        index={index}
        viewCount={viewCount}
        viewMax={viewMax}
      />
    )
  }

  return (
    <DesktopRow
      post={post}
      locale={locale}
      index={index}
      viewCount={viewCount}
      minReadLabel={minReadLabel}
      activeTag={activeTag}
    />
  )
}

function DesktopRow({
  post,
  locale,
  index,
  viewCount,
  minReadLabel,
  activeTag,
}: {
  readonly post: Post
  readonly locale: Locale
  readonly index: number
  readonly viewCount: number
  readonly minReadLabel: string
  readonly activeTag?: string
}) {
  const num = String(index + 1).padStart(3, "0")
  const cat = post.frontmatter.tags[0] ?? "DISPATCH"
  const readMin = estimateReadingTime(post.content)
  return (
    <Link
      href={getBlogPostPath(locale, post.slug)}
      className="group relative grid grid-cols-[56px_140px_1fr_auto] items-center gap-5 px-3 py-5 transition-colors hover:bg-cyber-bg-1/40"
    >
      <span className="pp-num text-base text-cyber-dim transition-colors group-hover:text-cyber-cyan">
        {num}
      </span>
      <ViewTransition name={`post-image-${post.slug}`} share="morph">
        <div className="relative aspect-video w-full overflow-hidden border border-cyber-line">
          <Image
            src={post.frontmatter.image ?? DEFAULT_THUMBNAIL}
            alt=""
            width={280}
            height={158}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-cyber-bg-0/60 to-transparent opacity-0 transition-opacity group-hover:opacity-100"
          />
        </div>
      </ViewTransition>
      <div className="min-w-0">
        <div className="mb-1.5 flex flex-wrap items-center gap-3">
          <span className="pp-tick text-cyber-amber/80 group-hover:text-cyber-amber">
            ◢ {cat.toUpperCase()}
          </span>
          <span className="pp-tick">
            {post.frontmatter.date.replace(/-/g, ".")}
          </span>
        </div>
        <ViewTransition name={`post-title-${post.slug}`} share="morph">
          <h3 className="pp-display truncate text-lg text-foreground transition-all group-hover:translate-x-2 group-hover:text-cyber-cyan md:text-xl">
            {post.frontmatter.title}
          </h3>
        </ViewTransition>
        {post.frontmatter.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
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
      </div>
      <div className="text-right">
        <div className="pp-num text-lg text-cyber-cyan">
          {viewCount.toLocaleString()}
        </div>
        <div className="pp-tick">
          {readMin} {minReadLabel}
        </div>
      </div>
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 w-0.5 bg-cyber-cyan opacity-0 shadow-[0_0_8px_var(--cyber-cyan)] transition-opacity group-hover:opacity-100"
      />
    </Link>
  )
}
