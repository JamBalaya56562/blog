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

import { nextNavigationMock } from "../setup-next-navigation-mock"

mock.module("next/navigation", () => ({
  ...nextNavigationMock,
  usePathname: () => "/en",
  useRouter: () => ({ push: () => {} }),
}))

const { RelatedPosts, getRelatedPosts } = await import(
  "@/components/related-posts"
)

afterEach(cleanup)

function createMockPost(overrides: Partial<Post> = {}): Post {
  return {
    content: "Test content",
    frontmatter: {
      date: "2025-01-01",
      description: "A test post",
      tags: ["test"],
      title: "Test Post",
      ...overrides.frontmatter,
    },
    locale: "en",
    slug: "test-post",
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
    // Cyber redesign: heading lives in a `.pp-tick` label decorated with
    // "RELATED DISPATCHES — <continueExploring>".
    expect(container.textContent).toContain("Continue Exploring")
  })

  test("displays '他の記事を探す' heading for Japanese locale", () => {
    const dictionary = getDictionary("ja")
    const posts = [createMockPost({ locale: "ja", slug: "post-1" })]
    const { container } = render(
      <RelatedPosts locale="ja" posts={posts} dictionary={dictionary} />,
    )
    expect(container.textContent).toContain("他の記事を探す")
  })
})

import fc from "fast-check"

const arbFrontmatter = fc.record({
  date: fc.integer({ max: 2030, min: 2000 }).chain((y) =>
    fc.integer({ max: 12, min: 1 }).chain((m) =>
      fc.integer({ max: 28, min: 1 }).map((d) => {
        const mm = String(m).padStart(2, "0")
        const dd = String(d).padStart(2, "0")
        return `${y}-${mm}-${dd}`
      }),
    ),
  ),
  description: fc.string(),
  image: fc.option(fc.constant("https://example.com/image.png"), {
    nil: undefined,
  }),
  tags: fc.array(fc.string({ minLength: 1 }), { maxLength: 5 }),
  title: fc.string({ minLength: 1 }),
})

const arbPost = fc.record({
  content: fc.string(),
  frontmatter: arbFrontmatter,
  locale: fc.constantFrom("en" as const, "ja" as const),
  slug: fc.string({ minLength: 1 }),
})

describe("Property 2: 記事フィルタリングと件数制限", () => {
  test("filtered results exclude current slug and have at most 3 items", () => {
    fc.assert(
      fc.property(
        fc.array(arbPost, { maxLength: 10, minLength: 0 }),
        fc.string({ minLength: 1 }),
        (posts, currentSlug) => {
          const filtered = getRelatedPosts(posts, currentSlug)
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
        fc.integer({ max: 5, min: 1 }),
        (slug, count) => {
          const posts = Array.from({ length: count }, (_, i) => ({
            content: "",
            frontmatter: {
              date: "2025-01-01",
              description: "",
              tags: [],
              title: `Post ${i}`,
            },
            locale: "en" as const,
            slug,
          }))
          const filtered = getRelatedPosts(posts, slug)
          expect(filtered).toEqual([])
        },
      ),
      { numRuns: 100 },
    )
  })
})
