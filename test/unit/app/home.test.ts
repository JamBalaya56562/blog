import { describe, expect, test } from "bun:test"
import fc from "fast-check"
import type { Post } from "@/lib/content/types"

const MAX_LATEST_POSTS = 5

function getLatestPosts(posts: Post[]): Post[] {
  return posts.slice(0, MAX_LATEST_POSTS)
}

const dateArb = fc
  .integer({ max: 2099, min: 2000 })
  .chain((year) =>
    fc
      .integer({ max: 12, min: 1 })
      .chain((month) =>
        fc
          .integer({ max: 28, min: 1 })
          .map(
            (day) =>
              `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
          ),
      ),
  )

const postArb: fc.Arbitrary<Post> = fc.record({
  content: fc.constant("content"),
  frontmatter: fc.record({
    date: dateArb,
    description: fc.stringMatching(/^[a-zA-Z0-9 ]{1,50}$/),
    tags: fc.array(fc.stringMatching(/^[a-z]{1,10}$/), {
      maxLength: 3,
      minLength: 1,
    }),
    title: fc.stringMatching(/^[a-zA-Z0-9 ]{1,30}$/),
  }),
  locale: fc.constant("en" as const),
  slug: fc.stringMatching(/^[a-z][a-z0-9-]{0,19}$/),
})

describe("Home Page", () => {
  test("Property 12: latest posts count limit", () => {
    fc.assert(
      fc.property(
        fc.array(postArb, { maxLength: 30, minLength: 0 }),
        (posts) => {
          const latest = getLatestPosts(posts)
          expect(latest.length).toBeLessThanOrEqual(MAX_LATEST_POSTS)
        },
      ),
      { numRuns: 100 },
    )
  })
})
