import { describe, expect, test } from "bun:test"
import { getDictionary } from "@/lib/i18n/get-dictionary"
import { localePageMetadata, openGraphSite } from "@/lib/metadata"

describe("localePageMetadata", () => {
  // Next resolves the export at runtime with `typeof mod.generateMetadata ===
  // "function"`, so the factory has to hand back a callable, not a promise.
  test("produces a function for Next to call", () => {
    expect(typeof localePageMetadata("/blog")).toBe("function")
  })

  test("applies the path it was built with", async () => {
    const generateMetadata = localePageMetadata("/blog")
    const metadata = await generateMetadata({
      params: Promise.resolve({ locale: "ja" }),
    })
    expect(metadata.alternates?.canonical).toBe(
      "https://kokohore56562wanwan.site/ja/blog",
    )
  })

  test("a locale root keeps the bare locale path", async () => {
    const generateMetadata = localePageMetadata("")
    const metadata = await generateMetadata({
      params: Promise.resolve({ locale: "en" }),
    })
    expect(metadata.alternates?.canonical).toBe(
      "https://kokohore56562wanwan.site/en",
    )
  })

  test("lists both locales", async () => {
    const generateMetadata = localePageMetadata("/portfolio")
    const metadata = await generateMetadata({
      params: Promise.resolve({ locale: "en" }),
    })
    expect(metadata.alternates?.languages).toEqual({
      en: "https://kokohore56562wanwan.site/en/portfolio",
      ja: "https://kokohore56562wanwan.site/ja/portfolio",
    })
  })

  // An unknown locale must not advertise alternates for a page that 404s.
  test("an unknown locale yields no metadata", async () => {
    const generateMetadata = localePageMetadata("/blog")
    expect(
      await generateMetadata({ params: Promise.resolve({ locale: "fr" }) }),
    ).toEqual({})
  })

  // The layout supplies `template: "%s | Jam's Blog"`, so the page hands back
  // its own segment only and Next composes the rest.
  test("resolves the title against the locale's dictionary", async () => {
    const generateMetadata = localePageMetadata("/blog", {
      title: (d) => d.blog.title,
    })
    for (const locale of ["en", "ja"] as const) {
      const metadata = await generateMetadata({
        params: Promise.resolve({ locale }),
      })
      expect(metadata.title).toBe(getDictionary(locale).blog.title)
    }
  })

  test("the two locales get different titles", async () => {
    const generateMetadata = localePageMetadata("/blog", {
      title: (d) => d.blog.title,
    })
    const en = await generateMetadata({
      params: Promise.resolve({ locale: "en" }),
    })
    const ja = await generateMetadata({
      params: Promise.resolve({ locale: "ja" }),
    })
    expect(en.title).not.toBe(ja.title)
  })

  // Omitting the selector is how the locale root keeps the site-wide default
  // rather than being retitled after its hero headline. The key has to be
  // absent, not present-and-undefined: Next treats an explicit `undefined` as
  // an override and the page ends up with an empty <title>.
  test("without a selector no title is set", async () => {
    const generateMetadata = localePageMetadata("")
    const metadata = await generateMetadata({
      params: Promise.resolve({ locale: "en" }),
    })
    expect("title" in metadata).toBe(false)
  })
})

describe("localePageMetadata descriptions", () => {
  test("resolves the description against the locale's dictionary", async () => {
    const generateMetadata = localePageMetadata("/blog", {
      description: (d) => d.blog.description,
    })
    for (const locale of ["en", "ja"] as const) {
      const metadata = await generateMetadata({
        params: Promise.resolve({ locale }),
      })
      expect(metadata.description).toBe(getDictionary(locale).blog.description)
    }
  })

  test("the two locales get different descriptions", async () => {
    const generateMetadata = localePageMetadata("/blog", {
      description: (d) => d.blog.description,
    })
    const en = await generateMetadata({
      params: Promise.resolve({ locale: "en" }),
    })
    const ja = await generateMetadata({
      params: Promise.resolve({ locale: "ja" }),
    })
    expect(en.description).not.toBe(ja.description)
  })

  // Title and description are independent: the locale root takes one without
  // the other.
  test("a description can be set without a title", async () => {
    const generateMetadata = localePageMetadata("", {
      description: (d) => d.home.description,
    })
    const metadata = await generateMetadata({
      params: Promise.resolve({ locale: "en" }),
    })
    expect("title" in metadata).toBe(false)
    expect(metadata.description).toBe(getDictionary("en").home.description)
  })

  test("without a selector no description is set", async () => {
    const generateMetadata = localePageMetadata("/blog")
    const metadata = await generateMetadata({
      params: Promise.resolve({ locale: "en" }),
    })
    expect("description" in metadata).toBe(false)
  })
})

type OgFields = {
  type?: string
  url?: string
  siteName?: string
  locale?: string
  alternateLocale?: string[]
  publishedTime?: string
  authors?: unknown
  tags?: unknown
}

function og(metadata: { openGraph?: unknown }): OgFields {
  return (metadata.openGraph ?? {}) as OgFields
}

function canonicalOf(metadata: {
  alternates?: { canonical?: unknown } | null
}): string {
  return String(metadata.alternates?.canonical)
}

describe("openGraph", () => {
  // Without these the crawler sees a title and an image but no idea what kind
  // of document it is, what its canonical address is, or what language it is
  // in — which is the state every page shipped in until now.
  test("a locale page declares itself a website with a URL and site name", async () => {
    const generateMetadata = localePageMetadata("/blog", {
      title: (d) => d.blog.title,
    })
    const metadata = await generateMetadata({
      params: Promise.resolve({ locale: "ja" }),
    })

    expect(og(metadata).type).toBe("website")
    expect(og(metadata).url).toBe("https://kokohore56562wanwan.site/ja/blog")
    expect(og(metadata).siteName).toBe(getDictionary("ja").header.siteName)
  })

  // og:locale wants language_TERRITORY, not the bare "ja" the routes use.
  test("locales are declared in the Open Graph format", async () => {
    const generateMetadata = localePageMetadata("")
    const ja = await generateMetadata({
      params: Promise.resolve({ locale: "ja" }),
    })
    expect(og(ja).locale).toBe("ja_JP")
    expect(og(ja).alternateLocale).toEqual(["en_US"])

    const en = await generateMetadata({
      params: Promise.resolve({ locale: "en" }),
    })
    expect(og(en).locale).toBe("en_US")
    expect(og(en).alternateLocale).toEqual(["ja_JP"])
  })

  test("the Open Graph URL is the canonical URL", async () => {
    const generateMetadata = localePageMetadata("/portfolio")
    const metadata = await generateMetadata({
      params: Promise.resolve({ locale: "en" }),
    })
    expect(og(metadata).url).toBe(canonicalOf(metadata))
  })

  test("an unknown locale still yields nothing at all", async () => {
    const generateMetadata = localePageMetadata("/blog")
    const metadata = await generateMetadata({
      params: Promise.resolve({ locale: "fr" }),
    })
    expect(metadata).toEqual({})
  })
})

describe("openGraphSite", () => {
  test("it never lists the current locale as an alternate", () => {
    for (const locale of ["en", "ja"] as const) {
      const og = openGraphSite(locale, "https://example.test/x")
      expect(og.alternateLocale).not.toContain(og.locale)
    }
  })
})
