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

/**
 * A slug that names no post got a card anyway: the site's name on a blank
 * description, as a 200. Anyone could mint one per made-up slug, and each was
 * rendered from scratch, since only the real slugs are prerendered.
 */
describe("post card responses", () => {
  async function card(locale: string, slug: string): Promise<Response> {
    const mod = await import(postRoute)
    return mod.default({ params: Promise.resolve({ locale, slug }) })
  }

  test("an unknown slug is a 404, not a card", async () => {
    const res = await card("en", "no-post-has-this-slug")
    expect(res.status).toBe(404)
    expect(res.headers.get("Content-Type")).not.toBe("image/png")
  })

  test("an unknown locale is a 404, even for a real slug", async () => {
    const [slug] = await new LocalContentLoader().getPostSlugs("en")
    const res = await card("xx", slug as string)
    expect(res.status).toBe(404)
  })

  test("a real post returns a complete PNG", async () => {
    const res = await card("en", "docker-build")
    expect(res.status).toBe(200)
    expect(res.headers.get("Content-Type")).toBe("image/png")

    const bytes = new Uint8Array(await res.arrayBuffer())
    expect([...bytes.slice(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10])
    // The final IEND chunk confirms that the PNG stream reached its end.
    expect([...bytes.slice(-12)]).toEqual([
      0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130,
    ])
  }, 30000)
})
