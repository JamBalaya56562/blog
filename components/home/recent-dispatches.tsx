import type { Route } from "next"
import Link from "next/link"
import { ViewTransition } from "react"
import { TagLink } from "@/components/home/tag-link"
import type { Post } from "@/lib/content/types"
import type { Locale } from "@/lib/i18n/config"
import type { Dictionary } from "@/lib/i18n/get-dictionary"
import { getBlogPostPath } from "@/lib/routes"

interface RecentDispatchesProps {
  readonly locale: Locale
  readonly dictionary: Dictionary
  readonly posts: Post[]
  readonly indexOffset?: number
}

export function RecentDispatches({
  locale,
  dictionary,
  posts,
  indexOffset = 0,
}: Readonly<RecentDispatchesProps>) {
  if (posts.length === 0) {
    return null
  }

  return (
    <section className="mx-auto max-w-7xl px-7 py-16">
      <div className="mb-8 flex items-baseline gap-4">
        <span className="pp-tick">◢ FEED</span>
        <h2 className="pp-display text-2xl tracking-[0.04em] text-foreground md:text-3xl">
          {dictionary.home.recentTitle}
        </h2>
        <span className="h-px flex-1 bg-cyber-line" />
        <Link
          href={`/${locale}/blog` as Route}
          className="pp-tick pp-link transition-colors hover:text-cyber-cyan"
        >
          {dictionary.home.viewAll} →
        </Link>
      </div>
      <p className="mb-8 max-w-2xl font-mono text-sm text-cyber-dim">
        {dictionary.home.recentDescription}
      </p>

      <ul className="flex flex-col">
        {posts.map((post, i) => {
          const num = String(i + 1 + indexOffset).padStart(3, "0")
          const tag = post.frontmatter.tags[0]
          const cat = tag ?? "DISPATCH"
          return (
            <li key={post.slug} className="border-t border-cyber-line">
              <Link
                href={getBlogPostPath(locale, post.slug)}
                className="group relative grid grid-cols-[64px_1fr_auto] items-center gap-5 px-3 py-5 transition-colors last:border-b last:border-cyber-line hover:bg-cyber-bg-1/40"
              >
                <span className="pp-num text-base text-cyber-dim transition-colors group-hover:text-cyber-cyan">
                  {num}
                </span>
                <div className="min-w-0">
                  <div className="mb-1.5 flex flex-wrap items-center gap-3">
                    <span className="pp-tick text-cyber-amber/80 group-hover:text-cyber-amber">
                      ◢ {cat.toUpperCase()}
                    </span>
                    <span className="pp-tick">
                      {post.frontmatter.date.replace(/-/g, ".")}
                    </span>
                  </div>
                  <ViewTransition
                    name={`post-title-${post.slug}`}
                    share="morph"
                  >
                    <h3 className="pp-display truncate text-lg text-foreground transition-all group-hover:translate-x-2 group-hover:text-cyber-cyan md:text-xl">
                      {post.frontmatter.title}
                    </h3>
                  </ViewTransition>
                  {post.frontmatter.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {post.frontmatter.tags.slice(0, 3).map((t) => (
                        <TagLink
                          key={t}
                          tag={t}
                          locale={locale}
                          className="pp-tag"
                        />
                      ))}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="pp-tick text-cyber-cyan opacity-0 transition-opacity group-hover:opacity-100">
                    {dictionary.home.readDispatch} →
                  </div>
                </div>
                {/* hover indicator bar */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-y-0 left-0 w-0.5 bg-cyber-cyan opacity-0 shadow-[0_0_8px_var(--cyber-cyan)] transition-opacity group-hover:opacity-100"
                />
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
