import { describe, expect, mock, test } from "bun:test"

// The page modules pull in `next/navigation`; only the metadata exports are
// under test here, so a bare stub is enough to let them load.
import { nextNavigationMock } from "../setup-next-navigation-mock"

mock.module("next/navigation", () => ({
  ...nextNavigationMock,
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND")
  },
}))

const pages = [
  ["@/app/[locale]/page", "https://kokohore56562wanwan.site/ja"],
  ["@/app/[locale]/blog/page", "https://kokohore56562wanwan.site/ja/blog"],
  [
    "@/app/[locale]/portfolio/page",
    "https://kokohore56562wanwan.site/ja/portfolio",
  ],
  [
    "@/app/[locale]/privacy-policy/page",
    "https://kokohore56562wanwan.site/ja/privacy-policy",
  ],
] as const

describe("locale page metadata", () => {
  for (const [specifier, canonical] of pages) {
    // Next reads the export at runtime and only calls it when it is a
    // function, so a page that stopped exporting one would lose its hreflang
    // set silently rather than failing the build.
    test(`${specifier} exports a callable generateMetadata`, async () => {
      const mod = await import(specifier)
      expect(typeof mod.generateMetadata).toBe("function")
    })

    test(`${specifier} resolves its own canonical`, async () => {
      const mod = await import(specifier)
      const metadata = await mod.generateMetadata({
        params: Promise.resolve({ locale: "ja" }),
      })
      expect(metadata.alternates?.canonical).toBe(canonical)
    })
  }
})
