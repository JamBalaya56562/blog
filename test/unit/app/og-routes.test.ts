import { describe, expect, test } from "bun:test"
import { LocalContentLoader } from "@/lib/content/local-loader"
import { locales } from "@/lib/i18n/config"

// Next discovers these by convention: it reads `size`, `contentType` and `alt`
// off the module and calls the default export. A route that stops exporting
// one of them loses its card without failing the build.
const localeRoutes = [
  "@/app/[locale]/opengraph-image",
  "@/app/[locale]/blog/opengraph-image",
  "@/app/[locale]/portfolio/opengraph-image",
  "@/app/[locale]/privacy-policy/opengraph-image",
]
const postRoute = "@/app/[locale]/blog/[slug]/opengraph-image"

describe("opengraph-image routes", () => {
  for (const specifier of [...localeRoutes, postRoute]) {
    test(`${specifier} exports the Next image contract`, async () => {
      const mod = await import(specifier)
      expect(mod.size).toEqual({ height: 630, width: 1200 })
      expect(mod.contentType).toBe("image/png")
      expect(typeof mod.alt).toBe("string")
      expect(mod.alt.length).toBeGreaterThan(0)
      expect(typeof mod.default).toBe("function")
      expect(typeof mod.generateStaticParams).toBe("function")
    })
  }

  // Without params for every route, the card would be rendered on demand in
  // production — where the distroless image has no fonts of its own.
  for (const specifier of localeRoutes) {
    test(`${specifier} prerenders both locales`, async () => {
      const mod = await import(specifier)
      const params = await mod.generateStaticParams()
      expect(params.map((p: { locale: string }) => p.locale).sort()).toEqual(
        [...locales].sort(),
      )
    })
  }

  test(`${postRoute} prerenders every post in every locale`, async () => {
    const mod = await import(postRoute)
    const params = await mod.generateStaticParams()

    const expected: string[] = []
    for (const locale of locales) {
      for (const slug of await new LocalContentLoader().getPostSlugs(locale)) {
        expected.push(`${locale}/${slug}`)
      }
    }

    expect(expected.length).toBeGreaterThan(0)
    expect(
      params
        .map((p: { locale: string; slug: string }) => `${p.locale}/${p.slug}`)
        .sort(),
    ).toEqual(expected.sort())
  })
})
