/** ページネーション計算結果 */
export interface PaginationResult<T> {
  items: T[]
  currentPage: number
  totalPages: number
}

/** ページ番号表示用の要素 */
export type PageItem = { type: "page"; page: number } | { type: "ellipsis" }

/** 1ページあたりの表示件数 */
export const POSTS_PER_PAGE = 6

/** 配列をページネーションする */
export function paginate<T>(
  items: T[],
  page: number,
  perPage: number,
): PaginationResult<T> {
  const totalPages = Math.max(1, Math.ceil(items.length / perPage))
  const currentPage = Math.min(Math.max(1, Math.round(page)), totalPages)
  const start = (currentPage - 1) * perPage
  return {
    items: items.slice(start, start + perPage),
    currentPage,
    totalPages,
  }
}

/** ページ番号の表示リストを生成する（省略記号含む） */
export function generatePageNumbers(
  currentPage: number,
  totalPages: number,
): PageItem[] {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, i) => ({
      type: "page" as const,
      page: i + 1,
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
    result.push({ type: "page", page: sorted[i] })
  }

  return result
}
