import { notFound } from "next/navigation"
import { Suspense } from "react"
import { createContentLoader } from "@/lib/content/loader"
import { filterPostsByTag } from "@/lib/content/sort-filter"
import type { Locale } from "@/lib/i18n/config"
import { isValidLocale } from "@/lib/i18n/config"
import { getDictionary } from "@/lib/i18n/get-dictionary"

async function BlogListContent({
  locale,
  searchParams,
}: {
  locale: Locale
  searchParams: Promise<{ tag?: string }>
}) {
  const { tag } = await searchParams
  const dictionary = getDictionary(locale)
  const loader = createContentLoader()
  let posts = await loader.getAllPosts(locale)

  if (tag) {
    posts = filterPostsByTag(posts, tag)
  }

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold">{dictionary.blog.title}</h1>
      {tag && (
        <div className="mb-4 flex items-center gap-2">
          <span>{dictionary.blog.filterByTag}</span>
          <span className="rounded bg-blue-100 px-2 py-1 text-sm font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            {tag}
          </span>
          <a
            href={`/${locale}/blog`}
            className="text-sm text-blue-600 hover:underline dark:text-blue-400"
          >
            {dictionary.blog.clearFilter}
          </a>
        </div>
      )}
      {posts.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">
          {dictionary.blog.noPostsFound}
        </p>
      ) : (
        <ul className="space-y-6">
          {posts.map((post) => (
            <li
              key={post.slug}
              className="border-b border-gray-200 pb-6 dark:border-gray-800"
            >
              <a
                href={`/${locale}/blog/${post.slug}`}
                className="text-xl font-semibold text-foreground hover:underline"
              >
                {post.frontmatter.title}
              </a>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {post.frontmatter.date}
              </p>
              <p className="mt-2 text-foreground">
                {post.frontmatter.description}
              </p>
              <div className="mt-2 flex gap-2">
                {post.frontmatter.tags.map((t) => (
                  <a
                    key={t}
                    href={`/${locale}/blog?tag=${encodeURIComponent(t)}`}
                    className={`rounded px-2 py-0.5 text-xs ${t === tag ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"}`}
                  >
                    {t}
                  </a>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default async function BlogListPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ tag?: string }>
}) {
  const { locale } = await params
  if (!isValidLocale(locale)) {
    notFound()
  }

  return (
    <Suspense>
      <BlogListContent locale={locale} searchParams={searchParams} />
    </Suspense>
  )
}
