import { describe, expect, test } from "bun:test"
import type { Post } from "@/lib/content/types"
import type { Locale } from "@/lib/i18n/config"
import { buildSitemap } from "@/lib/sitemap"

function post(
  slug: string,
  locale: Locale,
  date: string,
  updated?: string,
): Post {
  return {
    content: "body",
    frontmatter: {
      date,
      description: `${slug} description`,
      tags: ["t"],
      title: slug,
      ...(updated ? { updated } : {}),
    },
    locale,
    slug,
  }
}

// A translation can be corrected while the original stands, and the two URLs
// are crawled separately, so the fixture revises them on different days.
const byLocale = [
  [
    "en",
    [
      post("revised", "en", "2025-01-01", "2025-06-02"),
      post("untouched", "en", "2025-02-10"),
    ],
  ],
  [
    "ja",
    [
      post("revised", "ja", "2025-01-01", "2025-03-01"),
      post("untouched", "ja", "2025-02-10"),
    ],
  ],
] as const

function lastModifiedOf(path: string): Date | undefined {
  const entry = buildSitemap(byLocale).find(
    (e) => new URL(e.url).pathname === path,
  )
  expect(entry).toBeDefined()
  return entry?.lastModified as Date | undefined
}

// The sitemap reported the publication date, so a revised post told crawlers
// nothing had changed — the one thing `lastModified` is there to say. The
// JSON-LD and the og tags had been reading `updated` all along.
describe("sitemap lastModified", () => {
  test("a revised post reports the revision", () => {
    expect(lastModifiedOf("/en/blog/revised")).toEqual(new Date("2025-06-02"))
  })

  test("an unrevised post reports its publication date", () => {
    expect(lastModifiedOf("/en/blog/untouched")).toEqual(new Date("2025-02-10"))
  })

  // One entry per locale means one date per locale: collapsing the post to a
  // single date would hand both URLs whichever locale was read first.
  test("each locale reports its own revision", () => {
    expect(lastModifiedOf("/ja/blog/revised")).toEqual(new Date("2025-03-01"))
  })
})

describe("sitemap entries", () => {
  test("every locale of every post is listed, with both alternates", () => {
    const postEntries = buildSitemap(byLocale).filter((e) =>
      e.url.includes("/blog/"),
    )

    expect(postEntries.map((e) => new URL(e.url).pathname).sort()).toEqual([
      "/en/blog/revised",
      "/en/blog/untouched",
      "/ja/blog/revised",
      "/ja/blog/untouched",
    ])
    for (const entry of postEntries) {
      expect(Object.keys(entry.alternates?.languages ?? {}).sort()).toEqual([
        "en",
        "ja",
      ])
    }
  })

  // A post that exists in one locale only must not advertise an alternate
  // for the other: that hands a crawler a 404.
  test("a post written in one locale advertises only that locale", () => {
    const entries = buildSitemap([
      ["en", [post("solo", "en", "2025-01-01")]],
      ["ja", []],
    ])
    const solo = entries.filter((e) => e.url.includes("/blog/solo"))

    expect(solo).toHaveLength(1)
    expect(Object.keys(solo[0]?.alternates?.languages ?? {})).toEqual(["en"])
  })

  test("the static pages are listed in both locales", () => {
    const paths = buildSitemap([]).map((e) => new URL(e.url).pathname)

    expect(paths.sort()).toEqual([
      "/en",
      "/en/blog",
      "/en/portfolio",
      "/en/privacy-policy",
      "/ja",
      "/ja/blog",
      "/ja/portfolio",
      "/ja/privacy-policy",
    ])
  })
})
