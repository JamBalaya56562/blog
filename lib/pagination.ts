interface PaginationResult<T> {
  items: T[]
  currentPage: number
  totalPages: number
}

type PageItem = { type: "page"; page: number } | { type: "ellipsis" }

export const POSTS_PER_PAGE = 6

export function paginate<T>(
  items: T[],
  page: number,
  perPage: number,
): PaginationResult<T> {
  const totalPages = Math.max(1, Math.ceil(items.length / perPage))
  const clampedPage = Math.max(1, Math.floor(page))
  const currentPage = Math.min(clampedPage, totalPages)
  const start = (currentPage - 1) * perPage
  return {
    currentPage,
    items: items.slice(start, start + perPage),
    totalPages,
  }
}

export function generatePageNumbers(
  currentPage: number,
  totalPages: number,
): PageItem[] {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, i) => ({
      page: i + 1,
      type: "page" as const,
    }))
  }

  const pages = new Set<number>()
  pages.add(1)
  pages.add(totalPages)
  pages.add(currentPage)
  if (currentPage - 1 >= 1) {
    pages.add(currentPage - 1)
  }
  if (currentPage + 1 <= totalPages) {
    pages.add(currentPage + 1)
  }

  const sorted = [...pages].sort((a, b) => a - b)
  const result: PageItem[] = []

  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) {
      result.push({ type: "ellipsis" })
    }
    result.push({ page: sorted[i], type: "page" })
  }

  return result
}
