import { describe, expect, test } from "bun:test"
import { findAdjacentPosts } from "@/lib/content/adjacent"
import type { Post } from "@/lib/content/types"

function makePost(slug: string, date: string, title?: string): Post {
  return {
    slug,
    locale: "en",
    frontmatter: {
      title: title ?? `Title for ${slug}`,
      date,
      description: "desc",
      tags: [],
    },
    content: "",
  }
}

// Posts sorted by date descending (newest first)
const posts: Post[] = [
  makePost("post-c", "2024-03-01", "Post C"),
  makePost("post-b", "2024-02-01", "Post B"),
  makePost("post-a", "2024-01-01", "Post A"),
]

describe("findAdjacentPosts", () => {
  test("middle post returns both previous and next", () => {
    const result = findAdjacentPosts(posts, "post-b")
    expect(result.previous).toEqual({ slug: "post-a", title: "Post A" })
    expect(result.next).toEqual({ slug: "post-c", title: "Post C" })
  })

  test("first post (newest) has no next, has previous", () => {
    const result = findAdjacentPosts(posts, "post-c")
    expect(result.next).toBeNull()
    expect(result.previous).toEqual({ slug: "post-b", title: "Post B" })
  })

  test("last post (oldest) has no previous, has next", () => {
    const result = findAdjacentPosts(posts, "post-a")
    expect(result.previous).toBeNull()
    expect(result.next).toEqual({ slug: "post-b", title: "Post B" })
  })

  test("single post returns both null", () => {
    const single = [makePost("only", "2024-01-01")]
    const result = findAdjacentPosts(single, "only")
    expect(result.previous).toBeNull()
    expect(result.next).toBeNull()
  })

  test("empty list returns both null", () => {
    const result = findAdjacentPosts([], "any-slug")
    expect(result.previous).toBeNull()
    expect(result.next).toBeNull()
  })

  test("non-existent slug returns both null", () => {
    const result = findAdjacentPosts(posts, "no-such-post")
    expect(result.previous).toBeNull()
    expect(result.next).toBeNull()
  })
})

import fc from "fast-check"

describe("Feature: post-navigation, Property 1: accurate identification of adjacent posts", () => {
  /**
   * Generator: creates an array of unique slugs (at least 1),
   * builds Post objects with descending dates, and picks a random index.
   */
  const postsWithIndex = fc
    .uniqueArray(
      fc.string({ minLength: 1, maxLength: 20, unit: "grapheme-ascii" }),
      { minLength: 1, maxLength: 50 },
    )
    .chain((slugs) =>
      fc.record({
        slugs: fc.constant(slugs),
        index: fc.integer({ min: 0, max: slugs.length - 1 }),
      }),
    )

  function buildPosts(slugs: string[]): Post[] {
    const baseDate = new Date("2025-01-01")
    return slugs.map((slug, i) => {
      const date = new Date(baseDate.getTime() - i * 86_400_000)
      return makePost(slug, date.toISOString().slice(0, 10))
    })
  }

  test("previous and next match index-based expectations", () => {
    fc.assert(
      fc.property(postsWithIndex, ({ slugs, index }) => {
        const posts = buildPosts(slugs)
        const result = findAdjacentPosts(posts, slugs[index])

        // previous (older) = index + 1
        if (index < slugs.length - 1) {
          expect(result.previous).toEqual({
            slug: posts[index + 1].slug,
            title: posts[index + 1].frontmatter.title,
          })
        } else {
          expect(result.previous).toBeNull()
        }

        // next (newer) = index - 1
        if (index > 0) {
          expect(result.next).toEqual({
            slug: posts[index - 1].slug,
            title: posts[index - 1].frontmatter.title,
          })
        } else {
          expect(result.next).toBeNull()
        }
      }),
      { numRuns: 100 },
    )
  })
})
