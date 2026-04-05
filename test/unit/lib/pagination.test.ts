import { describe, expect, test } from "bun:test"
import fc from "fast-check"
import { generatePageNumbers, paginate } from "@/lib/pagination"

// Feature: blog-listing-redesign, Property 1: ページネーションのページサイズ上限
describe("Property 1: ページサイズ上限", () => {
  test("paginate().items.length <= perPage for any array, page, and perPage", () => {
    // **Validates: Requirements 3.1**
    fc.assert(
      fc.property(
        fc.array(fc.integer(), { minLength: 0, maxLength: 50 }),
        fc.integer({ min: -10, max: 100 }),
        fc.integer({ min: 1, max: 20 }),
        (items, page, perPage) => {
          const result = paginate(items, page, perPage)
          expect(result.items.length).toBeLessThanOrEqual(perPage)
        },
      ),
      { numRuns: 100 },
    )
  })
})

// Feature: blog-listing-redesign, Property 2: ページネーションの全項目保存
describe("Property 2: 全項目保存", () => {
  test("concatenating items from all pages equals the original array", () => {
    // **Validates: Requirements 3.1, 4.1**
    fc.assert(
      fc.property(
        fc.array(fc.integer(), { minLength: 0, maxLength: 50 }),
        fc.integer({ min: 1, max: 20 }),
        (items, perPage) => {
          const result = paginate(items, 1, perPage)
          const allItems: number[] = []
          for (let p = 1; p <= result.totalPages; p++) {
            const pageResult = paginate(items, p, perPage)
            allItems.push(...pageResult.items)
          }
          expect(allItems).toEqual(items)
        },
      ),
      { numRuns: 100 },
    )
  })
})

// Arbitrary: generates a valid { currentPage, totalPages } pair
const pageParamsArb = fc
  .integer({ min: 1, max: 100 })
  .chain((totalPages) =>
    fc
      .integer({ min: 1, max: totalPages })
      .map((currentPage) => ({ currentPage, totalPages })),
  )

// Feature: blog-listing-redesign, Property 3: ページ番号リストの妥当性
describe("Property 3: ページ番号リストの妥当性", () => {
  test("page list includes first, last, current page; is ascending; all in range", () => {
    // **Validates: Requirements 3.4, 3.7**
    fc.assert(
      fc.property(pageParamsArb, ({ currentPage, totalPages }) => {
        const pageItems = generatePageNumbers(currentPage, totalPages)
        const pageNumbers = pageItems
          .filter(
            (item): item is { type: "page"; page: number } =>
              item.type === "page",
          )
          .map((item) => item.page)

        // first and last page are included
        expect(pageNumbers).toContain(1)
        expect(pageNumbers).toContain(totalPages)

        // current page is included
        expect(pageNumbers).toContain(currentPage)

        // ascending order
        for (let i = 0; i < pageNumbers.length - 1; i++) {
          expect(pageNumbers[i]).toBeLessThan(pageNumbers[i + 1])
        }

        // all in range [1, totalPages]
        for (const p of pageNumbers) {
          expect(p).toBeGreaterThanOrEqual(1)
          expect(p).toBeLessThanOrEqual(totalPages)
        }
      }),
      { numRuns: 100 },
    )
  })
})

// Feature: blog-listing-redesign, Property 4: 省略記号の出現条件
describe("Property 4: 省略記号の出現条件", () => {
  test("ellipsis present when totalPages > 5, absent when totalPages <= 5", () => {
    // **Validates: Requirements 3.4**
    fc.assert(
      fc.property(pageParamsArb, ({ currentPage, totalPages }) => {
        const pageItems = generatePageNumbers(currentPage, totalPages)
        const hasEllipsis = pageItems.some((item) => item.type === "ellipsis")

        if (totalPages > 5) {
          expect(hasEllipsis).toBe(true)
        } else {
          expect(hasEllipsis).toBe(false)
        }
      }),
      { numRuns: 100 },
    )
  })
})

// Feature: blog-listing-redesign, Property 5: ページ番号の境界整合性
describe("Property 5: ページ番号の境界整合性", () => {
  test("invalid page numbers are clamped to [1, totalPages]", () => {
    // **Validates: Requirements 3.5, 3.6, 3.8**
    fc.assert(
      fc.property(
        fc.array(fc.integer(), { minLength: 1, maxLength: 50 }),
        fc.integer({ min: -100, max: 200 }),
        fc.integer({ min: 1, max: 20 }),
        (items, page, perPage) => {
          const result = paginate(items, page, perPage)
          expect(result.currentPage).toBeGreaterThanOrEqual(1)
          expect(result.currentPage).toBeLessThanOrEqual(result.totalPages)
        },
      ),
      { numRuns: 100 },
    )
  })
})
