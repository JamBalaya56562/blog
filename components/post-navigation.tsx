import Link from "next/link"
import { Brackets } from "@/components/ui/brackets"
import type { AdjacentPosts } from "@/lib/content/adjacent"
import type { Locale } from "@/lib/i18n/config"
import type { Dictionary } from "@/lib/i18n/get-dictionary"
import { getBlogPostPath } from "@/lib/routes"

interface PostNavigationProps {
  locale: Locale
  adjacentPosts: AdjacentPosts
  dictionary: Dictionary
}

export function PostNavigation({
  locale,
  adjacentPosts,
  dictionary,
}: Readonly<PostNavigationProps>) {
  const { previous, next } = adjacentPosts

  if (!previous && !next) {
    return null
  }

  return (
    <nav className="mt-12 flex flex-col gap-4 sm:flex-row sm:justify-between">
      {previous ? (
        <Link
          href={getBlogPostPath(locale, previous.slug)}
          className="pp-card-hover relative flex min-w-0 flex-1 flex-col border border-cyber-line bg-cyber-bg-1/40 p-4 transition-colors hover:border-cyber-cyan"
        >
          <Brackets />
          <span className="pp-tick mb-1 text-cyber-cyan">
            ◢ {dictionary.blog.previousPost}
          </span>
          <span className="pp-display truncate text-base text-foreground">
            ← {previous.title}
          </span>
        </Link>
      ) : (
        <div aria-hidden="true" className="hidden flex-1 sm:block" />
      )}
      {next ? (
        <Link
          href={getBlogPostPath(locale, next.slug)}
          className="pp-card-hover relative flex min-w-0 flex-1 flex-col border border-cyber-line bg-cyber-bg-1/40 p-4 text-right transition-colors hover:border-cyber-cyan"
        >
          <Brackets />
          <span className="pp-tick mb-1 text-cyber-amber">
            {dictionary.blog.nextPost} ◣
          </span>
          <span className="pp-display truncate text-base text-foreground">
            {next.title} →
          </span>
        </Link>
      ) : (
        <div aria-hidden="true" className="hidden flex-1 sm:block" />
      )}
    </nav>
  )
}
