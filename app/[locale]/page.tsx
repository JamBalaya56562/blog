import type { Route } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { createContentLoader } from "@/lib/content/loader"
import { isValidLocale } from "@/lib/i18n/config"
import { getDictionary } from "@/lib/i18n/get-dictionary"

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  "use cache"
  const { locale } = await params
  if (!isValidLocale(locale)) {
    notFound()
  }

  const dictionary = getDictionary(locale)
  const loader = createContentLoader()
  const posts = (await loader.getAllPosts(locale)).slice(0, 5)

  return (
    <div>
      <p className="mb-8 text-lg text-foreground">{dictionary.home.intro}</p>
      <h2 className="mb-4 text-2xl font-bold">{dictionary.home.latestPosts}</h2>
      {posts.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">
          {dictionary.blog.noPostsFound}
        </p>
      ) : (
        <ul className="space-y-3">
          {posts.map((post) => (
            <li
              key={post.slug}
              className="flex items-baseline justify-between gap-4"
            >
              <Link
                href={`/${locale}/blog/${post.slug}` as Route}
                className="font-medium text-foreground hover:underline"
              >
                {post.frontmatter.title}
              </Link>
              <span className="shrink-0 text-sm text-gray-500 dark:text-gray-400">
                {post.frontmatter.date}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
