import { describe, expect, mock, test } from "bun:test"
import { render } from "@testing-library/react"
import fc from "fast-check"
import type { AdjacentPosts } from "@/lib/content/adjacent"
import { locales } from "@/lib/i18n/config"
import { getDictionary } from "@/lib/i18n/get-dictionary"

mock.module("next/image", () => ({
  default: ({ alt = "", ...props }: Record<string, unknown>) => (
    <img alt={alt as string} {...props} />
  ),
}))

const { PostNavigation } = await import("@/components/post-navigation")

const dictionary = getDictionary("en")

const bothPosts: AdjacentPosts = {
  previous: { slug: "older-post", title: "Older Post Title" },
  next: { slug: "newer-post", title: "Newer Post Title" },
}

describe("PostNavigation", () => {
  test("renders both links when both exist", () => {
    const { container } = render(
      <PostNavigation
        locale="en"
        adjacentPosts={bothPosts}
        dictionary={dictionary}
      />,
    )
    const links = container.querySelectorAll("a")
    expect(links.length).toBe(2)
    expect(links[0].getAttribute("href")).toBe("/en/blog/older-post")
    expect(links[0].textContent).toContain("Older Post Title")
    expect(links[1].getAttribute("href")).toBe("/en/blog/newer-post")
    expect(links[1].textContent).toContain("Newer Post Title")
  })

  test("renders only previous link when next is null", () => {
    const { container } = render(
      <PostNavigation
        locale="en"
        adjacentPosts={{ previous: bothPosts.previous, next: null }}
        dictionary={dictionary}
      />,
    )
    const links = container.querySelectorAll("a")
    expect(links.length).toBe(1)
    expect(links[0].getAttribute("href")).toBe("/en/blog/older-post")
  })

  test("renders only next link when previous is null", () => {
    const { container } = render(
      <PostNavigation
        locale="en"
        adjacentPosts={{ previous: null, next: bothPosts.next }}
        dictionary={dictionary}
      />,
    )
    const links = container.querySelectorAll("a")
    expect(links.length).toBe(1)
    expect(links[0].getAttribute("href")).toBe("/en/blog/newer-post")
  })

  test("renders nothing when both are null", () => {
    const { container } = render(
      <PostNavigation
        locale="en"
        adjacentPosts={{ previous: null, next: null }}
        dictionary={dictionary}
      />,
    )
    expect(container.innerHTML).toBe("")
  })

  test("applies truncate class to titles", () => {
    const { container } = render(
      <PostNavigation
        locale="en"
        adjacentPosts={bothPosts}
        dictionary={dictionary}
      />,
    )
    const truncated = container.querySelectorAll(".truncate")
    expect(truncated.length).toBe(2)
  })

  test("uses Next.js Link component with correct href", () => {
    const { container } = render(
      <PostNavigation
        locale="ja"
        adjacentPosts={bothPosts}
        dictionary={getDictionary("ja")}
      />,
    )
    const links = container.querySelectorAll("a")
    expect(links[0].getAttribute("href")).toBe("/ja/blog/older-post")
    expect(links[1].getAttribute("href")).toBe("/ja/blog/newer-post")
  })
})

// Generators
const slugArb = fc.stringMatching(/^[a-z0-9]+(-[a-z0-9]+)*$/)

const adjacentPostArb = fc.record({
  slug: slugArb,
  title: fc.string({ minLength: 1, maxLength: 100, unit: "grapheme-ascii" }),
})

const adjacentPostsArb: fc.Arbitrary<AdjacentPosts> = fc.record({
  previous: fc.option(adjacentPostArb, { nil: null }),
  next: fc.option(adjacentPostArb, { nil: null }),
})

const localeArb = fc.constantFrom(...locales)

describe("Feature: post-navigation, Property 2: conditional link display", () => {
  test("link presence matches adjacentPosts state", () => {
    fc.assert(
      fc.property(adjacentPostsArb, (adjacentPosts) => {
        const { container } = render(
          <PostNavigation
            locale="en"
            adjacentPosts={adjacentPosts}
            dictionary={dictionary}
          />,
        )
        const links = container.querySelectorAll("a")
        const expectedCount =
          (adjacentPosts.previous ? 1 : 0) + (adjacentPosts.next ? 1 : 0)
        expect(links.length).toBe(expectedCount)
      }),
      { numRuns: 100 },
    )
  })
})

describe("Feature: post-navigation, Property 3: link href accuracy", () => {
  test("link hrefs follow /{locale}/blog/{slug} format", () => {
    fc.assert(
      fc.property(
        localeArb,
        fc.record({
          previous: adjacentPostArb,
          next: adjacentPostArb,
        }),
        (locale, adjacentPosts) => {
          const { container } = render(
            <PostNavigation
              locale={locale}
              adjacentPosts={adjacentPosts}
              dictionary={getDictionary(locale)}
            />,
          )
          const links = container.querySelectorAll("a")
          for (const link of links) {
            const href = link.getAttribute("href")
            expect(href).toMatch(new RegExp(`^/${locale}/blog/.+`))
          }
        },
      ),
      { numRuns: 100 },
    )
  })
})

describe("Feature: post-navigation, Property 4: label text matches dictionary", () => {
  test("labels match dictionary values", () => {
    fc.assert(
      fc.property(localeArb, (locale) => {
        const dict = getDictionary(locale)
        const { container } = render(
          <PostNavigation
            locale={locale}
            adjacentPosts={bothPosts}
            dictionary={dict}
          />,
        )
        const labels = container.querySelectorAll(".text-sm.text-gray-500")
        expect(labels[0].textContent).toBe(dict.blog.previousPost)
        expect(labels[1].textContent).toBe(dict.blog.nextPost)
      }),
      { numRuns: 100 },
    )
  })
})
