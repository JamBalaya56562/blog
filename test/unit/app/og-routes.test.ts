import { describe, expect, test } from "bun:test"
import { readFileSync } from "node:fs"
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

  // Params alone do not make a route static. With `cacheComponents`, an
  // uncached read anywhere in the handler keeps it dynamic: this route had
  // `generateStaticParams` and still built as `ƒ` while the four locale cards
  // built as `●`, so production rendered every post's card per request — 2.0s
  // cold, 0.5s warm, `max-age=0` — and fetched a font subset from Google each
  // time, on an image that carries no fonts of its own.
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

/**
 * The failure above is silent: the card still renders, just slowly and over
 * the network, so what is pinned is the shape that keeps the route static —
 * the handler reads nothing itself, and the function that reads is cached.
 */
describe("post card stays prerenderable", () => {
  const SOURCE = readFileSync(
    new URL(
      "../../../app/[locale]/blog/[slug]/opengraph-image.tsx",
      import.meta.url,
    ),
    "utf8",
  )

  function bodyOf(name: string): string {
    const start = SOURCE.indexOf(`function ${name}(`)
    if (start === -1) {
      throw new Error(`no top-level function named ${name}`)
    }
    const end = SOURCE.indexOf("\n}\n", start)
    return SOURCE.slice(start, end === -1 ? undefined : end)
  }

  test("the handler does not read content itself", () => {
    expect(bodyOf("Image")).not.toContain("createContentLoader")
  })

  test("the function that reads content is cached", () => {
    const reader = [...SOURCE.matchAll(/function (\w+)\(/g)]
      .map((match) => match[1] as string)
      .filter((name) => name !== "generateStaticParams")
      .find((name) => bodyOf(name).includes("createContentLoader"))

    expect(reader).toBeDefined()
    expect(bodyOf(reader as string)).toContain('"use cache"')
  })
})
