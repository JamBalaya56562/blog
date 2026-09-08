import { describe, expect, test } from "bun:test"
import { locales } from "@/lib/i18n/config"
import { getDictionary } from "@/lib/i18n/get-dictionary"
import { SITE_URL } from "@/lib/site"
import {
  blogPostingJsonLd,
  postBreadcrumb,
  websiteJsonLd,
} from "@/lib/structured-data"

/**
 * The site had a complete set of Open Graph tags and no schema.org at all,
 * which reads as an oversight only once you know the two are not the same job:
 * a crawler builds a share card from Open Graph, and Google builds a search
 * result from structured data, ignoring Open Graph for it.
 *
 * What these assert is the part that is easy to get wrong and impossible to
 * see: every URL absolute against the real origin, every human-readable string
 * in the page's own language. A relative URL or an English name on a Japanese
 * page is valid JSON and valid schema.org, and simply wrong.
 */

const post = {
  date: "2025-03-01",
  description: "A description",
  slug: "tailwind-css-v4-guide",
  tags: ["css", "tailwindcss"],
  title: "Tailwind CSS v4 Guide",
}

function urlsIn(value: unknown): string[] {
  if (typeof value === "string") {
    return value.startsWith("http") || value.startsWith("/") ? [value] : []
  }
  if (Array.isArray(value)) {
    return value.flatMap(urlsIn)
  }
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([key, nested]) =>
      key === "@context" ? [] : urlsIn(nested),
    )
  }
  return []
}

describe("structured data URLs", () => {
  // A crawler resolves a relative URL against whatever page it found the block
  // on, so a bare "/en/blog" silently means something different per page.
  test("every URL is absolute against the real origin", () => {
    const blocks = locales.flatMap((locale) => [
      websiteJsonLd(locale),
      blogPostingJsonLd(locale, post),
      postBreadcrumb(locale, post.slug, post.title),
    ])

    const urls = blocks.flatMap(urlsIn)
    expect(urls.length).toBeGreaterThan(0)
    for (const url of urls) {
      expect(url.startsWith(SITE_URL.origin), `not absolute: ${url}`).toBe(true)
    }
  })

  // `/` and `/blog` redirect to the default locale, so a crawler following one
  // from a Japanese page lands in English.
  test("no URL is one of the redirecting prefix-less paths", () => {
    const urls = [
      websiteJsonLd("ja"),
      blogPostingJsonLd("ja", post),
      postBreadcrumb("ja", post.slug, post.title),
    ].flatMap(urlsIn)

    for (const url of urls) {
      const path = url.slice(SITE_URL.origin.length)
      expect(path, `${url} skips the locale`).toMatch(/^\/(en|ja)(\/|$)/)
    }
  })
})

describe("websiteJsonLd", () => {
  test("names the site in the page's own language", () => {
    for (const locale of locales) {
      expect(websiteJsonLd(locale).name).toBe(
        getDictionary(locale).header.siteName,
      )
    }
    expect(websiteJsonLd("ja").name).not.toBe(websiteJsonLd("en").name)
  })

  test("declares the language it is in", () => {
    expect(websiteJsonLd("ja").inLanguage).toBe("ja")
  })
})

describe("blogPostingJsonLd", () => {
  test("is the type Google reads as an article", () => {
    expect(blogPostingJsonLd("en", post)["@type"]).toBe("BlogPosting")
  })

  // Without this the block describes an article that lives somewhere else.
  test("claims the page it sits on", () => {
    const data = blogPostingJsonLd("en", post)
    expect(data.mainEntityOfPage["@id"]).toBe(data.url)
  })

  test("carries the dates as ISO 8601", () => {
    const data = blogPostingJsonLd("en", post)
    expect(data.datePublished).toBe("2025-03-01T00:00:00.000Z")
  })

  test("reports a revision when the post declares one", () => {
    const data = blogPostingJsonLd("en", { ...post, updated: "2025-06-15" })
    expect(data.dateModified).toBe("2025-06-15T00:00:00.000Z")
    expect(data.datePublished).toBe("2025-03-01T00:00:00.000Z")
  })

  // Not a placeholder: a post nobody has revised really was last modified when
  // it was published, so the fallback is the true answer rather than a guess.
  test("falls back to publication when the post declares none", () => {
    const data = blogPostingJsonLd("en", post)
    expect(data.dateModified).toBe(data.datePublished)
  })

  test("points at the card the share preview already uses", () => {
    expect(blogPostingJsonLd("ja", post).image).toBe(
      `${SITE_URL.origin}/ja/blog/${post.slug}/opengraph-image`,
    )
  })

  test("keeps the tags rather than dropping them", () => {
    expect(blogPostingJsonLd("en", post).keywords).toEqual([
      "css",
      "tailwindcss",
    ])
  })
})

describe("postBreadcrumb", () => {
  test("is ordered from the root down to the post", () => {
    const trail = postBreadcrumb("en", post.slug, post.title).itemListElement
    expect(trail.map((c) => c.position)).toEqual([1, 2, 3])
    expect(trail.at(-1)?.name).toBe(post.title)
  })

  test("is labelled in the page's own language", () => {
    const ja = postBreadcrumb("ja", post.slug, post.title).itemListElement
    const dictionary = getDictionary("ja")
    expect(ja[0]?.name).toBe(dictionary.nav.home)
    expect(ja[1]?.name).toBe(dictionary.nav.blog)
  })
})
