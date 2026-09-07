import { describe, expect, test } from "bun:test"
import type { Post } from "@/lib/content/types"
import { buildFeed, FEED_CONTENT_TYPE } from "@/lib/feed"
import { feedPath, feedUrl } from "@/lib/site"

function post(
  slug: string,
  date: string,
  over: Partial<Post["frontmatter"]> = {},
): Post {
  return {
    content: "body",
    frontmatter: {
      date,
      description: `${slug} description`,
      tags: ["t"],
      title: slug,
      ...over,
    },
    locale: "en",
    slug,
  }
}

const base = {
  description: "site description",
  locale: "en" as const,
  title: "Jam's Blog",
}

describe("feed URLs", () => {
  test("the path and the absolute URL agree", () => {
    expect(feedPath("ja")).toBe("/ja/feed.xml")
    expect(feedUrl("ja")).toBe("https://kokohore56562wanwan.site/ja/feed.xml")
  })

  test("the content type is what readers expect", () => {
    expect(FEED_CONTENT_TYPE).toBe("application/rss+xml; charset=utf-8")
  })
})

describe("buildFeed", () => {
  test("is parseable XML with one item per post", () => {
    const xml = buildFeed({
      ...base,
      posts: [post("a", "2025-01-01"), post("b", "2025-02-01")],
    })
    expect(xml.startsWith('<?xml version="1.0" encoding="utf-8"?>')).toBe(true)
    expect(xml.match(/<item>/g)?.length).toBe(2)
    expect(xml).toContain("<language>en</language>")
  })

  test("items keep the order they were given", () => {
    const xml = buildFeed({
      ...base,
      posts: [post("newest", "2025-03-01"), post("oldest", "2025-01-01")],
    })
    expect(xml.indexOf("newest")).toBeLessThan(xml.indexOf("oldest"))
  })

  // Readers reject a feed whose dates are not RFC 822.
  test("dates are RFC 822, not ISO", () => {
    const xml = buildFeed({ ...base, posts: [post("a", "2025-03-01")] })
    expect(xml).toContain("<pubDate>Sat, 01 Mar 2025 00:00:00 GMT</pubDate>")
    expect(xml).not.toContain("<pubDate>2025-03-01")
  })

  // A title with a bare `&` or `<` produces a feed no reader can parse, and
  // the post titles come from frontmatter that nothing sanitises.
  test("markup in a title cannot break the document", () => {
    const xml = buildFeed({
      ...base,
      posts: [post("x", "2025-01-01", { title: "A & B <script> \"q\" 's'" })],
    })
    expect(xml).toContain("A &amp; B &lt;script&gt;")
    expect(xml).not.toContain("<script>")
    expect(() => new DOMParser().parseFromString(xml, "text/xml")).not.toThrow()
  })

  test("an empty blog still produces a valid channel", () => {
    const xml = buildFeed({ ...base, posts: [] })
    expect(xml).toContain("<channel>")
    expect(xml).not.toContain("<item>")
    expect(xml).not.toContain("<lastBuildDate>")
  })

  test("the self link points at this locale's feed", () => {
    const xml = buildFeed({ ...base, locale: "ja", posts: [] })
    expect(xml).toContain('href="https://kokohore56562wanwan.site/ja/feed.xml"')
  })
})
