import Link from "next/link"
import { generatePageNumbers } from "@/lib/pagination"

interface PaginationProps {
  currentPage: number
  totalPages: number
  basePath: string
  searchParams?: Record<string, string>
  labels: {
    previous: string
    next: string
    pagination: string
  }
}

function buildHref(
  basePath: string,
  page: number,
  searchParams?: Record<string, string>,
): string {
  const params = new URLSearchParams()
  if (searchParams) {
    for (const [key, value] of Object.entries(searchParams)) {
      if (key !== "page") {
        params.set(key, value)
      }
    }
  }
  if (page > 1) {
    params.set("page", String(page))
  }
  const qs = params.toString()
  return qs ? `${basePath}?${qs}` : basePath
}

export function Pagination({
  currentPage,
  totalPages,
  basePath,
  searchParams,
  labels,
}: Readonly<PaginationProps>) {
  if (totalPages <= 1) {
    return null
  }

  const pageItems = generatePageNumbers(currentPage, totalPages)
  const isFirstPage = currentPage <= 1
  const isLastPage = currentPage >= totalPages

  return (
    <nav
      aria-label={labels.pagination}
      className="mt-12 flex items-center justify-center gap-1"
    >
      {isFirstPage ? (
        <span
          aria-disabled="true"
          className="rounded-lg px-3 py-2 text-sm text-on-surface-variant opacity-50 pointer-events-none"
        >
          {labels.previous}
        </span>
      ) : (
        <Link
          href={buildHref(basePath, currentPage - 1, searchParams)}
          className="rounded-lg px-3 py-2 text-sm text-on-surface-variant transition-colors hover:bg-surface-container"
        >
          {labels.previous}
        </Link>
      )}

      {pageItems.map((item, _index) => {
        if (item.type === "ellipsis") {
          // Use surrounding page numbers to create a stable key
          const prevPage = pageItems[_index - 1]
          const keyId = prevPage?.type === "page" ? prevPage.page : _index
          return (
            <span
              key={`ellipsis-after-${keyId}`}
              className="px-2 py-2 text-sm text-on-surface-variant"
            >
              …
            </span>
          )
        }

        const isCurrent = item.page === currentPage
        return isCurrent ? (
          <span
            key={item.page}
            aria-current="page"
            className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-on-primary"
          >
            {item.page}
          </span>
        ) : (
          <Link
            key={item.page}
            href={buildHref(basePath, item.page, searchParams)}
            className="rounded-lg px-3 py-2 text-sm text-on-surface-variant transition-colors hover:bg-surface-container"
          >
            {item.page}
          </Link>
        )
      })}

      {isLastPage ? (
        <span
          aria-disabled="true"
          className="rounded-lg px-3 py-2 text-sm text-on-surface-variant opacity-50 pointer-events-none"
        >
          {labels.next}
        </span>
      ) : (
        <Link
          href={buildHref(basePath, currentPage + 1, searchParams)}
          className="rounded-lg px-3 py-2 text-sm text-on-surface-variant transition-colors hover:bg-surface-container"
        >
          {labels.next}
        </Link>
      )}
    </nav>
  )
}
