import { describe, expect, test } from "bun:test"
import { readFileSync } from "node:fs"

/**
 * `/sitemap.xml` and both feeds were rendered on demand for the same reason
 * the post cards were (#1189): under `cacheComponents` an uncached read keeps
 * a route dynamic, whatever `generateStaticParams` says. A feed reader polling
 * hourly had every poll re-read the content and rebuild the XML.
 *
 * Nothing about the output changes when this regresses, so it is checked as
 * structure. The feed cannot cache its handler — a `Response` is not
 * something a cache entry can hold — so the rule differs per route: the
 * sitemap caches its body, the feed caches the string it puts in the body.
 */
const routes = [
  {
    cached: "sitemap",
    path: "app/sitemap.ts",
    reader: "sitemap",
  },
  {
    cached: "feedFor",
    path: "app/[locale]/feed.xml/route.ts",
    reader: "GET",
  },
] as const

function bodyOf(source: string, name: string): string {
  const start = source.indexOf(`function ${name}(`)
  if (start === -1) {
    throw new Error(`no top-level function named ${name}`)
  }
  const end = source.indexOf("\n}\n", start)
  return source.slice(start, end === -1 ? undefined : end)
}

describe("routes that must stay prerenderable", () => {
  for (const route of routes) {
    const source = readFileSync(route.path, "utf8")

    test(`${route.path} caches the function that reads content`, () => {
      expect(bodyOf(source, route.cached)).toContain('"use cache"')
    })

    test(`${route.path} reads content only from there`, () => {
      const reads = [...source.matchAll(/function (\w+)\(/g)]
        .map((match) => match[1] as string)
        .filter((name) => name !== "generateStaticParams")
        .filter((name) => bodyOf(source, name).includes("createContentLoader"))

      expect(reads).toEqual([route.cached])
    })
  }

  test("the feed answers with a cache header", () => {
    const source = readFileSync("app/[locale]/feed.xml/route.ts", "utf8")

    expect(bodyOf(source, "GET")).toContain("Cache-Control")
  })
})
