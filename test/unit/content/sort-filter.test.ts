import { describe, expect, test } from "bun:test"
import fc from "fast-check"
import { filterPostsByTag, sortPostsByDate } from "@/lib/content/sort-filter"
import type { Post } from "@/lib/content/types"

const dateArb = fc
  .integer({ min: 2000, max: 2099 })
  .chain((year) =>
    fc
      .integer({ min: 1, max: 12 })
      .chain((month) =>
        fc
          .integer({ min: 1, max: 28 })
          .map(
            (day) =>
              `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
          ),
      ),
  )

const postArb: fc.Arbitrary<Post> = fc.record({
  slug: fc.stringMatching(/^[a-z][a-z0-9-]{0,19}$/),
  locale: fc.constantFrom("en" as const, "ja" as const),
  frontmatter: fc.record({
    title: fc.stringMatching(/^[a-zA-Z0-9 ]{1,30}$/),
    date: dateArb,
    description: fc.stringMatching(/^[a-zA-Z0-9 ]{1,50}$/),
    tags: fc.array(fc.stringMatching(/^[a-z]{1,10}$/), {
      minLength: 1,
      maxLength: 5,
    }),
  }),
  content: fc.constant("content"),
})

describe("Sort and Filter", () => {
  test("Property 6: date descending sort", () => {
    fc.assert(
      fc.property(
        fc.array(postArb, { minLength: 1, maxLength: 20 }),
        (posts) => {
          const sorted = sortPostsByDate(posts)
          for (let i = 0; i < sorted.length - 1; i++) {
            expect(
              sorted[i].frontmatter.date >= sorted[i + 1].frontmatter.date,
            ).toBe(true)
          }
        },
      ),
      { numRuns: 100 },
    )
  })

  test("Property 7: tag filtering accuracy", () => {
    fc.assert(
      fc.property(
        fc.array(postArb, { minLength: 1, maxLength: 20 }),
        fc.stringMatching(/^[a-z]{1,10}$/),
        (posts, tag) => {
          const filtered = filterPostsByTag(posts, tag)
          for (const post of filtered) {
            expect(post.frontmatter.tags).toContain(tag)
          }
        },
      ),
      { numRuns: 100 },
    )
  })

  test("Property 8: sort preserved after filtering", () => {
    fc.assert(
      fc.property(
        fc.array(postArb, { minLength: 1, maxLength: 20 }),
        fc.stringMatching(/^[a-z]{1,10}$/),
        (posts, tag) => {
          const sorted = sortPostsByDate(posts)
          const filtered = filterPostsByTag(sorted, tag)
          for (let i = 0; i < filtered.length - 1; i++) {
            expect(
              filtered[i].frontmatter.date >= filtered[i + 1].frontmatter.date,
            ).toBe(true)
          }
        },
      ),
      { numRuns: 100 },
    )
  })
})
