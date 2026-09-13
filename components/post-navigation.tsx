import Link from "next/link"
import type { AdjacentPosts } from "@/lib/content/adjacent"
import type { Locale } from "@/lib/i18n/config"
import type { Dictionary } from "@/lib/i18n/get-dictionary"
import { getBlogPostPath } from "@/lib/routes"

/**
 * Three chevrons that light up one after another on hover, outermost first,
 * from `.pp-nv-chv` in globals.css. Decoration only: the label above the
 * title already says which way the card goes, so these are hidden from
 * assistive technology — the old arrow characters were read aloud.
 */
function Chevrons({ glyph }: Readonly<{ glyph: string }>) {
  return (
    <span aria-hidden="true" className="pp-nv-chv">
      <i>{glyph}</i>
      <i>{glyph}</i>
      <i>{glyph}</i>
    </span>
  )
}

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
          transitionTypes={["nav-back"]}
          className="pp-card-hover pp-nv pp-nv-l relative flex min-w-0 flex-1 flex-col border border-cyber-line bg-cyber-bg-1/40 py-4 pr-4 pl-6 hover:border-cyber-cyan"
        >
          <span className="pp-tick mb-1 text-cyber-cyan">
            ◢ {dictionary.blog.previousPost}
          </span>
          <span className="pp-display truncate text-base text-foreground">
            <Chevrons glyph="«" /> {previous.title}
          </span>
        </Link>
      ) : (
        <div aria-hidden="true" className="hidden flex-1 sm:block" />
      )}
      {next ? (
        <Link
          href={getBlogPostPath(locale, next.slug)}
          transitionTypes={["nav-forward"]}
          className="pp-card-hover pp-nv pp-nv-r relative flex min-w-0 flex-1 flex-col border border-cyber-line bg-cyber-bg-1/40 py-4 pr-6 pl-4 text-right hover:border-cyber-cyan"
        >
          <span className="pp-tick mb-1 text-cyber-amber">
            {dictionary.blog.nextPost} ◣
          </span>
          <span className="pp-display truncate text-base text-foreground">
            {next.title} <Chevrons glyph="»" />
          </span>
        </Link>
      ) : (
        <div aria-hidden="true" className="hidden flex-1 sm:block" />
      )}
    </nav>
  )
}
