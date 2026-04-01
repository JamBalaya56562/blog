import Link from "next/link"
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
          className="flex min-w-0 flex-1 flex-col rounded border border-gray-200 p-4 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
        >
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {dictionary.blog.previousPost}
          </span>
          <span className="truncate font-medium">{previous.title}</span>
        </Link>
      ) : (
        <div aria-hidden="true" className="hidden flex-1 sm:block" />
      )}
      {next ? (
        <Link
          href={getBlogPostPath(locale, next.slug)}
          className="flex min-w-0 flex-1 flex-col rounded border border-gray-200 p-4 text-right hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
        >
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {dictionary.blog.nextPost}
          </span>
          <span className="truncate font-medium">{next.title}</span>
        </Link>
      ) : (
        <div aria-hidden="true" className="hidden flex-1 sm:block" />
      )}
    </nav>
  )
}
