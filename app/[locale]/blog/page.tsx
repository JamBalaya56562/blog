import type { Route } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Suspense } from "react"
import { BlogListRow } from "@/components/blog/blog-list-row"
import { TagLink } from "@/components/home/tag-link"
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
import { getBlogPostPath } from "@/lib/routes"

async function getCachedPosts(locale: Locale) {
  "use cache"
  const loader = createContentLoader()
  return loader.getAllPosts(locale)
}

async function getCachedAllViewCounts() {
  "use cache"
  return getAllViewCounts()
}

const TAG_LIMIT = 12

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
  const allPosts = await getCachedPosts(locale)
  let posts = allPosts

  if (tag) {
    posts = filterPostsByTag(posts, tag)
  }
  if (q) {
    posts = filterPostsByKeyword(posts, q)
  }

  if (sort === "popular") {
    const allViews = await getCachedAllViewCounts()
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

  // Highest view count on this page — used to scale each ArticleCard's
  // popularity bar relatively. Floors at 100 so a fresh blog with no
  // recorded views still renders a non-empty bar.
  const pageViewMax = Math.max(100, ...Array.from(viewCounts.values()))

  // Tag chips: top tags by frequency across all posts
  const tagCounts = new Map<string, number>()
  for (const p of allPosts) {
    for (const t of p.frontmatter.tags) {
      tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1)
    }
  }
  const topTags = [...tagCounts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, TAG_LIMIT)
    .map(([t]) => t)

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
    <section className="px-7 py-12">
      <h1 className="pp-display text-5xl text-foreground sm:text-6xl">
        {dictionary.blog.title}
        <span className="text-cyber-cyan">.</span>
      </h1>
      <p className="mt-2 font-mono text-xs text-cyber-dim">
        {"// "}
        {posts.length} of {allPosts.length} {dictionary.blog.dispatchesMatch}
      </p>

      <div className="mt-7 flex flex-wrap items-center gap-3">
        <div className="min-w-[260px] flex-1 sm:max-w-[380px]">
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

      {/* Tag chips */}
      <div className="mt-5 flex flex-wrap gap-1.5">
        <Link
          href={`/${locale}/blog` as Route}
          className="pp-tag"
          data-active={!tag ? "true" : undefined}
        >
          ALL
        </Link>
        {topTags.map((t) => (
          <TagLink
            key={t}
            tag={t}
            locale={locale}
            className="pp-tag"
            active={t === tag}
          />
        ))}
      </div>

      {q && (
        <div className="mt-5 flex flex-wrap items-center gap-2 font-mono text-xs">
          <span className="text-cyber-dim">
            {dictionary.blog.searchResultsFor}
          </span>
          <span className="border border-cyber-cyan/60 bg-cyber-cyan/10 px-2 py-0.5 text-cyber-cyan">
            {q}
          </span>
          <Link
            href={
              `/${locale}/blog${tag ? `?tag=${encodeURIComponent(tag)}` : ""}` as Route
            }
            className="pp-link text-cyber-amber transition-colors hover:text-cyber-cyan"
          >
            {dictionary.blog.clearSearch}
          </Link>
        </div>
      )}

      {posts.length === 0 ? (
        <p className="mt-12 text-center font-mono text-cyber-dim">
          {"// "}
          {dictionary.blog.noPostsFound}
        </p>
      ) : (
        <>
          {/* Each row picks ONE layout (mobile card or desktop numbered
              row) on the client based on `matchMedia` so we never ship
              duplicate `view-transition-name`s in the same tree. SSR
              defaults to the mobile card. */}
          <ul className="mt-8 flex flex-col gap-4 sm:gap-0">
            {items.map((post, i) => {
              const absIndex = (currentPage - 1) * POSTS_PER_PAGE + i
              const views = viewCounts.get(post.slug) ?? 0
              return (
                <li
                  key={post.slug}
                  className="sm:border-t sm:border-cyber-line sm:last:border-b"
                >
                  <BlogListRow
                    post={post}
                    locale={locale}
                    index={absIndex}
                    viewCount={views}
                    viewMax={pageViewMax}
                    minReadLabel={dictionary.blog.minRead}
                    activeTag={tag}
                  />
                </li>
              )
            })}
          </ul>
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
    </section>
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
    <div className="mx-auto max-w-7xl">
      <Suspense fallback={<BlogListSkeleton />}>
        <BlogListContent locale={locale} searchParams={searchParams} />
      </Suspense>
    </div>
  )
}
