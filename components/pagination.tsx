import type { Route } from "next"
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
): Route {
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
  return (qs ? `${basePath}?${qs}` : basePath) as Route
}

const baseCell =
  "flex h-9 min-w-9 items-center justify-center px-3 font-mono text-[11px] uppercase tracking-[0.18em] transition-colors"

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
      className="mt-12 flex flex-wrap items-center justify-center gap-1 border-t border-cyber-line pt-6"
    >
      {isFirstPage ? (
        <span
          aria-disabled="true"
          className={`${baseCell} pointer-events-none border border-cyber-line text-cyber-dimmer`}
        >
          ← {labels.previous}
        </span>
      ) : (
        <Link
          href={buildHref(basePath, currentPage - 1, searchParams)}
          className={`${baseCell} border border-cyber-line text-cyber-dim hover:border-cyber-cyan hover:text-cyber-cyan`}
        >
          ← {labels.previous}
        </Link>
      )}

      {pageItems.map((item, _index) => {
        if (item.type === "ellipsis") {
          const prevPage = pageItems[_index - 1]
          const keyId = prevPage?.type === "page" ? prevPage.page : _index
          return (
            <span
              key={`ellipsis-after-${keyId}`}
              className={`${baseCell} text-cyber-dim`}
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
            className={`${baseCell} bg-cyber-cyan text-cyber-bg-0`}
          >
            {item.page}
          </span>
        ) : (
          <Link
            key={item.page}
            href={buildHref(basePath, item.page, searchParams)}
            className={`${baseCell} border border-cyber-line text-cyber-dim hover:border-cyber-cyan hover:text-cyber-cyan`}
          >
            {item.page}
          </Link>
        )
      })}

      {isLastPage ? (
        <span
          aria-disabled="true"
          className={`${baseCell} pointer-events-none border border-cyber-line text-cyber-dimmer`}
        >
          {labels.next} →
        </span>
      ) : (
        <Link
          href={buildHref(basePath, currentPage + 1, searchParams)}
          className={`${baseCell} border border-cyber-line text-cyber-dim hover:border-cyber-cyan hover:text-cyber-cyan`}
        >
          {labels.next} →
        </Link>
      )}
    </nav>
  )
}
