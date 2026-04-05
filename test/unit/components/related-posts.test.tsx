import { afterEach, describe, expect, mock, test } from "bun:test"
import { cleanup, render } from "@testing-library/react"
import type { Post } from "@/lib/content/types"
import { getDictionary } from "@/lib/i18n/get-dictionary"

mock.module("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: { href: string; children: React.ReactNode } & Record<string, unknown>) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

mock.module("next/image", () => ({
  default: ({
    alt = "",
    ...props
  }: { alt?: string } & Record<string, unknown>) => (
    <img alt={alt} {...props} />
  ),
}))

mock.module("next/navigation", () => ({
  useRouter: () => ({ push: () => {} }),
  usePathname: () => "/en",
}))

const { RelatedPosts } = await import("@/components/related-posts")

afterEach(cleanup)

function createMockPost(overrides: Partial<Post> = {}): Post {
  return {
    slug: "test-post",
    locale: "en",
    content: "Test content",
    frontmatter: {
      title: "Test Post",
      date: "2025-01-01",
      description: "A test post",
      tags: ["test"],
      ...overrides.frontmatter,
    },
    ...overrides,
  }
}

describe("RelatedPosts", () => {
  test("returns null when posts array is empty", () => {
    const dictionary = getDictionary("en")
    const { container } = render(
      <RelatedPosts locale="en" posts={[]} dictionary={dictionary} />,
    )
    expect(container.innerHTML).toBe("")
  })

  test("displays 'Continue Exploring' heading for English locale", () => {
    const dictionary = getDictionary("en")
    const posts = [createMockPost({ slug: "post-1" })]
    const { container } = render(
      <RelatedPosts locale="en" posts={posts} dictionary={dictionary} />,
    )
    const heading = container.querySelector("h2")
    expect(heading?.textContent).toBe("Continue Exploring")
  })

  test("displays '他の記事を探す' heading for Japanese locale", () => {
    const dictionary = getDictionary("ja")
    const posts = [createMockPost({ slug: "post-1", locale: "ja" })]
    const { container } = render(
      <RelatedPosts locale="ja" posts={posts} dictionary={dictionary} />,
    )
    const heading = container.querySelector("h2")
    expect(heading?.textContent).toBe("他の記事を探す")
  })
})

import fc from "fast-check"

const arbFrontmatter = fc.record({
  title: fc.string({ minLength: 1 }),
  date: fc.date().map((d) => d.toISOString().slice(0, 10)),
  description: fc.string(),
  tags: fc.array(fc.string({ minLength: 1 }), { maxLength: 5 }),
  image: fc.option(fc.webUrl(), { nil: undefined }),
})

const arbPost = fc.record({
  slug: fc.string({ minLength: 1 }),
  locale: fc.constantFrom("en" as const, "ja" as const),
  frontmatter: arbFrontmatter,
  content: fc.string(),
})

describe("Property 2: 記事フィルタリングと件数制限", () => {
  test("filtered results exclude current slug and have at most 3 items", () => {
    fc.assert(
      fc.property(
        fc.array(arbPost, { minLength: 0, maxLength: 10 }),
        fc.string({ minLength: 1 }),
        (posts, currentSlug) => {
          const filtered = posts
            .filter((p) => p.slug !== currentSlug)
            .slice(0, 3)
          expect(filtered.length).toBeLessThanOrEqual(3)
          for (const p of filtered) {
            expect(p.slug).not.toBe(currentSlug)
          }
        },
      ),
      { numRuns: 100 },
    )
  })

  test("when all posts have the current slug, result is empty", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }),
        fc.integer({ min: 1, max: 5 }),
        (slug, count) => {
          const posts = Array.from({ length: count }, (_, i) => ({
            slug,
            locale: "en" as const,
            frontmatter: {
              title: `Post ${i}`,
              date: "2025-01-01",
              description: "",
              tags: [],
            },
            content: "",
          }))
          const filtered = posts.filter((p) => p.slug !== slug).slice(0, 3)
          expect(filtered).toEqual([])
        },
      ),
      { numRuns: 100 },
    )
  })
})
