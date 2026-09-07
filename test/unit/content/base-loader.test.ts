import { describe, expect, test } from "bun:test"
import { BaseContentLoader } from "@/lib/content/base-loader"
import { LocalContentLoader } from "@/lib/content/local-loader"
import type { Post } from "@/lib/content/types"
import type { Locale } from "@/lib/i18n/config"

function post(slug: string, date: string): Post {
  return {
    content: "content",
    frontmatter: { date, description: "d", tags: ["t"], title: slug },
    locale: "en",
    slug,
  }
}

class StubLoader extends BaseContentLoader {
  private readonly posts: Record<string, Post | null>

  constructor(posts: Record<string, Post | null>) {
    super()
    this.posts = posts
  }

  async getPostSlugs(_locale: Locale): Promise<string[]> {
    return Object.keys(this.posts)
  }

  async getPost(_locale: Locale, slug: string): Promise<Post | null> {
    return this.posts[slug] ?? null
  }
}

describe("BaseContentLoader.getAllPosts", () => {
  test("returns newest first regardless of slug order", async () => {
    const loader = new StubLoader({
      a: post("a", "2023-01-01"),
      b: post("b", "2024-06-01"),
      c: post("c", "2025-12-31"),
    })
    const posts = await loader.getAllPosts("en")
    expect(posts.map((p) => p.slug)).toEqual(["c", "b", "a"])
  })

  // A slug can survive listing and still fail to load — a file deleted between
  // the two calls, or one with unparseable frontmatter. Both loaders answer
  // `null` there, and one bad post must not take the whole list down.
  test("drops slugs that fail to load", async () => {
    const loader = new StubLoader({
      alsoGood: post("alsoGood", "2025-01-01"),
      broken: null,
      good: post("good", "2024-01-01"),
    })
    const posts = await loader.getAllPosts("en")
    expect(posts.map((p) => p.slug)).toEqual(["alsoGood", "good"])
    expect(posts).not.toContain(null)
  })

  test("an empty source yields an empty list", async () => {
    expect(await new StubLoader({}).getAllPosts("en")).toEqual([])
  })

  test("every post it returns belongs to the requested locale", async () => {
    const loader = new LocalContentLoader()
    for (const locale of ["en", "ja"] as const) {
      const posts = await loader.getAllPosts(locale)
      expect(posts.length).toBeGreaterThan(0)
      for (const p of posts) {
        expect(p.locale).toBe(locale)
      }
    }
  })

  // The concrete loaders used to carry byte-identical copies of this method.
  test("the real loaders inherit the shared implementation", async () => {
    const loader = new LocalContentLoader()
    expect(loader).toBeInstanceOf(BaseContentLoader)
    expect(loader.getAllPosts).toBe(BaseContentLoader.prototype.getAllPosts)
  })

  test("LocalContentLoader sorts its own content newest first", async () => {
    const posts = await new LocalContentLoader().getAllPosts("en")
    const dates = posts.map((p) => p.frontmatter.date)
    expect([...dates].sort().reverse()).toEqual(dates)
  })
})
