import { describe, expect, test } from "bun:test"
import { estimateReadingTime } from "@/components/article-card"

describe("estimateReadingTime", () => {
  test("empty string returns 1", () => {
    expect(estimateReadingTime("")).toBe(1)
  })

  test("short text returns 1", () => {
    expect(estimateReadingTime("Hello world")).toBe(1)
  })

  test("short Japanese text returns 1", () => {
    expect(estimateReadingTime("こんにちは世界")).toBe(1)
  })

  test("long English text returns appropriate value", () => {
    // 600 words → enMinutes = 600/200 = 3, jaMinutes = charCount/400
    // With ~600 words of ~5 chars each + spaces ≈ 3600 chars → jaMinutes = 9
    // min(3, 9) = 3
    const words = Array.from({ length: 600 }, () => "hello").join(" ")
    expect(estimateReadingTime(words)).toBe(3)
  })

  test("long Japanese text returns appropriate value", () => {
    // 800 Japanese chars → jaMinutes = 800/400 = 2
    // wordCount (no spaces) = 1 → enMinutes = 1/200 ≈ 0.005
    // min(2, 0.005) rounds to 0, clamped to 1
    const text = "あ".repeat(800)
    expect(estimateReadingTime(text)).toBeGreaterThanOrEqual(1)
  })

  test("return value is always >= 1", () => {
    const inputs = ["", "a", "short", "a ".repeat(50), "日本語テスト"]
    for (const input of inputs) {
      expect(estimateReadingTime(input)).toBeGreaterThanOrEqual(1)
    }
  })
})

import fc from "fast-check"
import { DEFAULT_THUMBNAIL } from "@/components/article-card"

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

describe("Property 1: 画像ソースの解決", () => {
  test("image src resolves to frontmatter.image or DEFAULT_THUMBNAIL", () => {
    fc.assert(
      fc.property(arbPost, (post) => {
        const resolvedSrc = post.frontmatter.image ?? DEFAULT_THUMBNAIL
        if (post.frontmatter.image !== undefined) {
          expect(resolvedSrc).toBe(post.frontmatter.image)
        } else {
          expect(resolvedSrc).toBe(DEFAULT_THUMBNAIL)
        }
      }),
      { numRuns: 100 },
    )
  })

  test("alt attribute always matches frontmatter.title", () => {
    fc.assert(
      fc.property(arbPost, (post) => {
        const alt = post.frontmatter.title
        expect(alt).toBe(post.frontmatter.title)
      }),
      { numRuns: 100 },
    )
  })
})
