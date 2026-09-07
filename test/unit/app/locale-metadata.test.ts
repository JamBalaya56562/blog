import { describe, expect, mock, test } from "bun:test"
import type { Locale } from "@/lib/i18n/config"
import { getDictionary } from "@/lib/i18n/get-dictionary"

// The page modules pull in `next/navigation`; only the metadata exports are
// under test here, so a bare stub is enough to let them load.
import { nextNavigationMock } from "../setup-next-navigation-mock"

mock.module("next/navigation", () => ({
  ...nextNavigationMock,
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND")
  },
}))

// `title` is the segment the page owns; the layout's
// `template: "%s | Jam's Blog"` composes the rest. `undefined` means the page
// keeps the site-wide default, which is what the locale root wants.
const pages = [
  {
    description: (locale: Locale) => getDictionary(locale).home.description,
    path: "",
    specifier: "@/app/[locale]/page",
    title: () => undefined,
  },
  {
    description: (locale: Locale) => getDictionary(locale).blog.description,
    path: "/blog",
    specifier: "@/app/[locale]/blog/page",
    title: (locale: Locale) => getDictionary(locale).blog.title,
  },
  {
    description: (locale: Locale) =>
      getDictionary(locale).portfolio.description,
    path: "/portfolio",
    specifier: "@/app/[locale]/portfolio/page",
    title: (locale: Locale) => getDictionary(locale).portfolio.title,
  },
  {
    description: (locale: Locale) =>
      getDictionary(locale).privacyPolicy.description,
    path: "/privacy-policy",
    specifier: "@/app/[locale]/privacy-policy/page",
    title: (locale: Locale) => getDictionary(locale).privacyPolicy.title,
  },
] as const

const locales: readonly Locale[] = ["en", "ja"]

describe("locale page metadata", () => {
  for (const { specifier, path, title, description } of pages) {
    // Next reads the export at runtime and only calls it when it is a
    // function, so a page that stopped exporting one would lose its hreflang
    // set silently rather than failing the build.
    test(`${specifier} exports a callable generateMetadata`, async () => {
      const mod = await import(specifier)
      expect(typeof mod.generateMetadata).toBe("function")
    })

    for (const locale of locales) {
      test(`${specifier} resolves its own canonical in ${locale}`, async () => {
        const mod = await import(specifier)
        const metadata = await mod.generateMetadata({
          params: Promise.resolve({ locale }),
        })
        expect(metadata.alternates?.canonical).toBe(
          `https://kokohore56562wanwan.site/${locale}${path}`,
        )
      })

      test(`${specifier} carries its ${locale} title`, async () => {
        const mod = await import(specifier)
        const metadata = await mod.generateMetadata({
          params: Promise.resolve({ locale }),
        })
        expect(metadata.title).toBe(title(locale))
      })

      test(`${specifier} carries its ${locale} description`, async () => {
        const mod = await import(specifier)
        const metadata = await mod.generateMetadata({
          params: Promise.resolve({ locale }),
        })
        expect(metadata.description).toBe(description(locale))
      })
    }
  }

  // The three subpages all rendered as a bare "Jam's Blog" in production
  // before this; the point of the titles is that they stop colliding.
  test("the subpages no longer share one title", async () => {
    const titles = await Promise.all(
      pages
        .filter((p) => p.path !== "")
        .map(async ({ specifier }) => {
          const mod = await import(specifier)
          const metadata = await mod.generateMetadata({
            params: Promise.resolve({ locale: "en" }),
          })
          return metadata.title
        }),
    )
    expect(new Set(titles).size).toBe(titles.length)
    expect(titles).not.toContain(undefined)
  })
})

// Every page used to fall through to the layout's single English description,
// so the Japanese pages advertised English text and all four looked identical
// to a crawler.
describe("locale page descriptions", () => {
  test("no two pages share a description", async () => {
    const seen: string[] = []
    for (const { specifier } of pages) {
      for (const locale of locales) {
        const mod = await import(specifier)
        const metadata = await mod.generateMetadata({
          params: Promise.resolve({ locale }),
        })
        expect(metadata.description).toBeTruthy()
        seen.push(metadata.description)
      }
    }
    expect(new Set(seen).size).toBe(seen.length)
  })

  test("no description falls back to the layout's English default", async () => {
    for (const { specifier } of pages) {
      const mod = await import(specifier)
      const metadata = await mod.generateMetadata({
        params: Promise.resolve({ locale: "ja" }),
      })
      expect(metadata.description).not.toBe(
        "A blog about web development, built with Next.js and MDX.",
      )
    }
  })
})
