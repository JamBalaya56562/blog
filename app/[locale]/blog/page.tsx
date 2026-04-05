import type { Route } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Suspense } from "react"
import { ArticleCard } from "@/components/article-card"
import { Pagination } from "@/components/pagination"
import { createContentLoader } from "@/lib/content/loader"
import { filterPostsByTag } from "@/lib/content/sort-filter"
import type { Locale } from "@/lib/i18n/config"
import { isValidLocale } from "@/lib/i18n/config"
import { getDictionary } from "@/lib/i18n/get-dictionary"
import { POSTS_PER_PAGE, paginate } from "@/lib/pagination"

async function BlogListContent({
  locale,
  searchParams,
}: {
  locale: Locale
  searchParams: Promise<{ tag?: string; page?: string }>
}) {
  const { tag, page: pageParam } = await searchParams
  const dictionary = getDictionary(locale)
  const loader = createContentLoader()
  let posts = await loader.getAllPosts(locale)

  if (tag) {
    posts = filterPostsByTag(posts, tag)
  }

  const page = Math.max(1, Number(pageParam) || 1)
  const { items, currentPage, totalPages } = paginate(
    posts,
    page,
    POSTS_PER_PAGE,
  )

  const paginationSearchParams: Record<string, string> = {}
  if (tag) {
    paginationSearchParams.tag = tag
  }

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold">{dictionary.blog.title}</h1>
      <div className="mb-4 flex items-center gap-2">
        {tag ? (
          <>
            <span>{dictionary.blog.filterByTag}</span>
            <span className="rounded bg-blue-100 px-2 py-1 text-sm font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              {tag}
            </span>
            <Link
              href={`/${locale}/blog` as Route}
              className="text-sm text-blue-600 hover:underline dark:text-blue-400"
            >
              {dictionary.blog.clearFilter}
            </Link>
          </>
        ) : (
          <>
            <span>{dictionary.blog.filterByTag}</span>
            <span className="text-sm text-on-surface-variant">
              {dictionary.blog.noActiveFilter}
            </span>
          </>
        )}
      </div>
      {posts.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">
          {dictionary.blog.noPostsFound}
        </p>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {items.map((post) => (
              <ArticleCard key={post.slug} post={post} locale={locale} />
            ))}
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            basePath={`/${locale}/blog`}
            searchParams={paginationSearchParams}
            labels={{
              previous: dictionary.blog.previousPage,
              next: dictionary.blog.nextPage,
              pagination: dictionary.blog.pagination,
            }}
          />
        </>
      )}
    </div>
  )
}

export default async function BlogListPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ tag?: string; page?: string }>
}) {
  const { locale } = await params
  if (!isValidLocale(locale)) {
    notFound()
  }

  return (
    <div className="mx-auto max-w-5xl">
      <Suspense>
        <BlogListContent locale={locale} searchParams={searchParams} />
      </Suspense>
    </div>
  )
}
