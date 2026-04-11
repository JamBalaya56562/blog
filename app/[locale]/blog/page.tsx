import type { Route } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Suspense } from "react"
import { ArticleCard } from "@/components/article-card"
import { Pagination } from "@/components/pagination"
import { SearchInput } from "@/components/search-input"
import { BlogListSkeleton } from "@/components/skeletons"
import { SortSelect } from "@/components/sort-select"
import { createContentLoader } from "@/lib/content/loader"
import {
  filterPostsByKeyword,
  filterPostsByTag,
  sortPostsByViews,
} from "@/lib/content/sort-filter"
import { getAllViewCounts, getViewCounts } from "@/lib/db/queries"
import type { Locale } from "@/lib/i18n/config"
import { isValidLocale } from "@/lib/i18n/config"
import { getDictionary } from "@/lib/i18n/get-dictionary"
import { POSTS_PER_PAGE, paginate } from "@/lib/pagination"

async function BlogListContent({
  locale,
  searchParams,
}: {
  locale: Locale
  searchParams: Promise<{
    tag?: string
    page?: string
    q?: string
    sort?: string
  }>
}) {
  const { tag, page: pageParam, q, sort } = await searchParams
  const dictionary = getDictionary(locale)
  const loader = createContentLoader()
  let posts = await loader.getAllPosts(locale)

  if (tag) {
    posts = filterPostsByTag(posts, tag)
  }
  if (q) {
    posts = filterPostsByKeyword(posts, q)
  }

  if (sort === "popular") {
    const allViews = await getAllViewCounts()
    const allViewsMap = new Map(allViews.map((v) => [v.slug, v.count]))
    posts = sortPostsByViews(posts, allViewsMap)
  }

  const page = Math.max(1, Number(pageParam) || 1)
  const { items, currentPage, totalPages } = paginate(
    posts,
    page,
    POSTS_PER_PAGE,
  )

  const viewCounts = await getViewCounts(items.map((p) => p.slug))

  const paginationSearchParams: Record<string, string> = {}
  if (tag) {
    paginationSearchParams.tag = tag
  }
  if (q) {
    paginationSearchParams.q = q
  }
  if (sort) {
    paginationSearchParams.sort = sort
  }

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold">{dictionary.blog.title}</h1>
      <div className="mb-4 flex flex-col sm:flex-row gap-2">
        <div className="flex-1">
          <Suspense>
            <SearchInput
              placeholder={dictionary.blog.searchPlaceholder}
              label={dictionary.blog.searchLabel}
              basePath={`/${locale}/blog`}
            />
          </Suspense>
        </div>
        <Suspense>
          <SortSelect
            labels={{
              sortLabel: dictionary.blog.sortLabel,
              sortNewest: dictionary.blog.sortNewest,
              sortPopular: dictionary.blog.sortPopular,
            }}
            basePath={`/${locale}/blog`}
          />
        </Suspense>
      </div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {q && (
          <>
            <span>{dictionary.blog.searchResultsFor}</span>
            <span className="rounded bg-green-100 px-2 py-1 text-sm font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
              {q}
            </span>
            <Link
              href={
                `/${locale}/blog${tag ? `?tag=${encodeURIComponent(tag)}` : ""}` as Route
              }
              className="text-sm text-blue-600 hover:underline dark:text-blue-400"
            >
              {dictionary.blog.clearSearch}
            </Link>
          </>
        )}
        {tag ? (
          <>
            <span>{dictionary.blog.filterByTag}</span>
            <span className="rounded bg-blue-100 px-2 py-1 text-sm font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              {tag}
            </span>
            <Link
              href={
                `/${locale}/blog${q ? `?q=${encodeURIComponent(q)}` : ""}` as Route
              }
              className="text-sm text-blue-600 hover:underline dark:text-blue-400"
            >
              {dictionary.blog.clearFilter}
            </Link>
          </>
        ) : (
          !q && (
            <>
              <span>{dictionary.blog.filterByTag}</span>
              <span className="text-sm text-on-surface-variant">
                {dictionary.blog.noActiveFilter}
              </span>
            </>
          )
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
              <ArticleCard
                key={post.slug}
                post={post}
                locale={locale}
                viewCount={viewCounts.get(post.slug)}
              />
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
  searchParams: Promise<{
    tag?: string
    page?: string
    q?: string
    sort?: string
  }>
}) {
  const { locale } = await params
  if (!isValidLocale(locale)) {
    notFound()
  }

  return (
    <div className="mx-auto max-w-5xl">
      <Suspense fallback={<BlogListSkeleton />}>
        <BlogListContent locale={locale} searchParams={searchParams} />
      </Suspense>
    </div>
  )
}
