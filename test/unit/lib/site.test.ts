import { describe, expect, test } from "bun:test"
import { locales } from "@/lib/i18n/config"
import { feedPath, feedUrl, localeAlternates, SITE_URL } from "@/lib/site"

describe("localeAlternates", () => {
  test("canonical points at the page itself", () => {
    expect(localeAlternates("ja", "/blog/x").canonical).toBe(
      "https://kokohore56562wanwan.site/ja/blog/x",
    )
  })

  test("a locale root is the bare locale path", () => {
    expect(localeAlternates("en", "").canonical).toBe(
      "https://kokohore56562wanwan.site/en",
    )
  })

  test("both locales are listed by default", () => {
    expect(localeAlternates("en", "/blog").languages).toEqual({
      en: "https://kokohore56562wanwan.site/en/blog",
      ja: "https://kokohore56562wanwan.site/ja/blog",
      "x-default": "https://kokohore56562wanwan.site/blog",
    })
  })

  // Every post happens to be translated right now, so only this can cover it:
  // a post written in one language must not advertise the other, or hreflang
  // points a crawler at a 404. The sample posts this blog started with were
  // exactly that, and they have since been replaced by translated ones.
  test("an untranslated page advertises only the locale it exists in", () => {
    const alternates = localeAlternates("en", "/blog/only-english", ["en"])

    expect(alternates.languages).toEqual({
      en: "https://kokohore56562wanwan.site/en/blog/only-english",
      "x-default": "https://kokohore56562wanwan.site/blog/only-english",
    })
    expect(alternates.languages).not.toHaveProperty("ja")
  })

  // `x-default` is where a crawler sends a reader whose language matches
  // neither locale. The prefix-less path is right for it because `proxy.ts`
  // redirects it — /blog goes to /en/blog.
  test("x-default points at the prefix-less path", () => {
    const languages = localeAlternates("ja", "/portfolio").languages
    expect(languages["x-default"]).toBe(
      "https://kokohore56562wanwan.site/portfolio",
    )
  })

  test("the locale root's x-default is the site root, not an empty path", () => {
    expect(localeAlternates("en", "").languages["x-default"]).toBe(
      "https://kokohore56562wanwan.site/",
    )
  })

  // `proxy.ts` sends the prefix-less path to the default locale, so a post
  // that does not exist in that locale would have x-default land on a 404.
  test("a page missing from the default locale advertises no x-default", () => {
    const languages = localeAlternates("ja", "/blog/only-japanese", [
      "ja",
    ]).languages

    expect(languages).not.toHaveProperty("x-default")
    expect(languages).toEqual({
      ja: "https://kokohore56562wanwan.site/ja/blog/only-japanese",
    })
  })

  test("the site origin has no trailing path to double up separators", () => {
    expect(SITE_URL.pathname).toBe("/")
    expect(localeAlternates("en", "/blog").canonical).not.toContain("//blog")
  })

  // The `<link rel="alternate" type="application/rss+xml">` this becomes is
  // how feed readers find the feed from any page URL. Every page routes its
  // alternates through here, so losing it here loses autodiscovery site-wide.
  test("every page advertises its own locale's feed", () => {
    for (const locale of locales) {
      expect(localeAlternates(locale, "/blog").types).toEqual({
        "application/rss+xml": feedUrl(locale),
      })
    }
  })

  test("the feed advertised is the one the footer links to", () => {
    for (const locale of locales) {
      expect(feedUrl(locale).endsWith(feedPath(locale))).toBe(true)
    }
  })
})
