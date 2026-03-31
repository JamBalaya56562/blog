import { describe, expect, test } from "bun:test"
import fc from "fast-check"
import type { Post } from "@/lib/content/types"

const MAX_LATEST_POSTS = 5

function getLatestPosts(posts: Post[]): Post[] {
  return posts.slice(0, MAX_LATEST_POSTS)
}

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
  locale: fc.constant("en" as const),
  frontmatter: fc.record({
    title: fc.stringMatching(/^[a-zA-Z0-9 ]{1,30}$/),
    date: dateArb,
    description: fc.stringMatching(/^[a-zA-Z0-9 ]{1,50}$/),
    tags: fc.array(fc.stringMatching(/^[a-z]{1,10}$/), {
      minLength: 1,
      maxLength: 3,
    }),
  }),
  content: fc.constant("content"),
})

describe("Home Page", () => {
  test("Property 12: latest posts count limit", () => {
    fc.assert(
      fc.property(
        fc.array(postArb, { minLength: 0, maxLength: 30 }),
        (posts) => {
          const latest = getLatestPosts(posts)
          expect(latest.length).toBeLessThanOrEqual(MAX_LATEST_POSTS)
        },
      ),
      { numRuns: 100 },
    )
  })
})
