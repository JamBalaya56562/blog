import { describe, expect, mock, test } from "bun:test"
import { SITE_URL } from "@/lib/site"

// The locale layout is a document root: it pulls in `next/font`, which only
// loads inside a Next build, and `next/navigation`. Neither has anything to do
// with the metadata under test.
import { nextNavigationMock } from "../setup-next-navigation-mock"

mock.module("@/lib/fonts", () => ({ fontVars: "" }))
mock.module("next/navigation", () => ({ ...nextNavigationMock }))

/**
 * Paths to every value the cache would not hand back unchanged: anything that
 * is not a plain object, an array or a primitive. A class instance crossing a
 * `"use cache"` boundary is serialized through its `toJSON`, or dropped when it
 * has none, and React logs the substitution on every render.
 */
function classInstancesIn(value: unknown, path = ""): string[] {
  if (value === null || typeof value !== "object") {
    return []
  }
  if (Array.isArray(value)) {
    return value.flatMap((item, i) => classInstancesIn(item, `${path}[${i}]`))
  }
  if (Object.getPrototypeOf(value) !== Object.prototype) {
    return [`${path}: ${value.constructor.name}`]
  }
  return Object.entries(value).flatMap(([key, item]) =>
    classInstancesIn(item, path ? `${path}.${key}` : key),
  )
}

/**
 * `metadataBase` is the one metadata field that has to be a `URL` — the type
 * admits nothing else — and the locale layout that owns every other field is
 * `"use cache"`. Returned from there, the URL reached React's serializer,
 * which took its `toJSON` and said so on every render:
 *
 *   Only plain objects can be passed to Client Components from Server
 *   Components. URL objects are not supported.
 *
 * The href that came out still resolved, so nothing shipped wrong, but the
 * warning was real and could not be silenced in place. The root layout renders
 * no markup and is not cached, so the base is declared there and never enters
 * a cache entry.
 */
describe("metadataBase", () => {
  test("the root layout declares it", async () => {
    const mod = await import("@/app/layout")

    expect(mod.metadata.metadataBase).toBe(SITE_URL)
  })

  test("the cached locale layout returns nothing the cache would rewrite", async () => {
    const mod = await import("@/app/[locale]/layout")
    const metadata = await mod.generateMetadata({
      params: Promise.resolve({ locale: "en" }),
    })

    expect(classInstancesIn(metadata)).toEqual([])
  })
})
