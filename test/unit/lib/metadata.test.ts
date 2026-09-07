import { describe, expect, test } from "bun:test"
import { localeAlternatesMetadata } from "@/lib/metadata"

describe("localeAlternatesMetadata", () => {
  // Next resolves the export at runtime with `typeof mod.generateMetadata ===
  // "function"`, so the factory has to hand back a callable, not a promise.
  test("produces a function for Next to call", () => {
    expect(typeof localeAlternatesMetadata("/blog")).toBe("function")
  })

  test("applies the path it was built with", async () => {
    const generateMetadata = localeAlternatesMetadata("/blog")
    const metadata = await generateMetadata({
      params: Promise.resolve({ locale: "ja" }),
    })
    expect(metadata.alternates?.canonical).toBe(
      "https://kokohore56562wanwan.site/ja/blog",
    )
  })

  test("a locale root keeps the bare locale path", async () => {
    const generateMetadata = localeAlternatesMetadata("")
    const metadata = await generateMetadata({
      params: Promise.resolve({ locale: "en" }),
    })
    expect(metadata.alternates?.canonical).toBe(
      "https://kokohore56562wanwan.site/en",
    )
  })

  test("lists both locales", async () => {
    const generateMetadata = localeAlternatesMetadata("/portfolio")
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
    const generateMetadata = localeAlternatesMetadata("/blog")
    expect(
      await generateMetadata({ params: Promise.resolve({ locale: "fr" }) }),
    ).toEqual({})
  })
})
