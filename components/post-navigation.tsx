import type { Route } from "next"
import Link from "next/link"
import type { AdjacentPosts } from "@/lib/content/adjacent"
import type { Locale } from "@/lib/i18n/config"
import type { Dictionary } from "@/lib/i18n/get-dictionary"

interface PostNavigationProps {
  locale: Locale
  adjacentPosts: AdjacentPosts
  dictionary: Dictionary
}

export function PostNavigation({
  locale,
  adjacentPosts,
  dictionary,
}: Readonly<PostNavigationProps>): JSX.Element | null {
  const { previous, next } = adjacentPosts

  if (!previous && !next) {
    return null
  }

  return (
    <nav className="mt-12 flex flex-col gap-4 sm:flex-row sm:justify-between">
      {previous ? (
        <Link
          href={`/${locale}/blog/${previous.slug}` as Route}
          className="flex min-w-0 flex-1 flex-col rounded border border-gray-200 p-4 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
        >
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {dictionary.blog.previousPost}
          </span>
          <span className="truncate font-medium">{previous.title}</span>
        </Link>
      ) : (
        <span className="hidden flex-1 sm:block" />
      )}
      {next && (
        <Link
          href={`/${locale}/blog/${next.slug}` as Route}
          className="flex min-w-0 flex-1 flex-col rounded border border-gray-200 p-4 text-right hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
        >
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {dictionary.blog.nextPost}
          </span>
          <span className="truncate font-medium">{next.title}</span>
        </Link>
      )}
    </nav>
  )
}
