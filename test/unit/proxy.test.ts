import { describe, expect, test } from "bun:test"
import { defaultLocale, locales } from "@/lib/i18n/config"

/**
 * Extract the locale-redirect logic into testable pure functions
 * that mirror what proxy.ts does, so we can unit-test without
 * depending on Next.js request/response internals.
 */
function hasLocalePrefix(pathname: string): boolean {
  return locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  )
}

function getRedirectPathname(pathname: string): string | null {
  if (hasLocalePrefix(pathname)) {
    return null
  }
  return `/${defaultLocale}${pathname}`
}

describe("proxy locale redirect", () => {
  describe("hasLocalePrefix", () => {
    test("returns true for exact locale path /en", () => {
      expect(hasLocalePrefix("/en")).toBe(true)
    })

    test("returns true for exact locale path /ja", () => {
      expect(hasLocalePrefix("/ja")).toBe(true)
    })

    test("returns true for locale-prefixed paths", () => {
      expect(hasLocalePrefix("/en/blog")).toBe(true)
      expect(hasLocalePrefix("/ja/blog")).toBe(true)
      expect(hasLocalePrefix("/en/blog/my-post")).toBe(true)
    })

    test("returns false for root path", () => {
      expect(hasLocalePrefix("/")).toBe(false)
    })

    test("returns false for paths without locale prefix", () => {
      expect(hasLocalePrefix("/blog")).toBe(false)
      expect(hasLocalePrefix("/about")).toBe(false)
      expect(hasLocalePrefix("/blog/my-post")).toBe(false)
    })

    test("returns false for paths that start with locale-like strings but are not locales", () => {
      expect(hasLocalePrefix("/english")).toBe(false)
      expect(hasLocalePrefix("/japan")).toBe(false)
    })
  })

  describe("getRedirectPathname", () => {
    test("redirects root / to /en", () => {
      expect(getRedirectPathname("/")).toBe("/en/")
    })

    test("redirects /blog to /en/blog", () => {
      expect(getRedirectPathname("/blog")).toBe("/en/blog")
    })

    test("redirects nested paths to default locale", () => {
      expect(getRedirectPathname("/blog/my-post")).toBe("/en/blog/my-post")
    })

    test("returns null for paths already prefixed with /en", () => {
      expect(getRedirectPathname("/en")).toBeNull()
      expect(getRedirectPathname("/en/blog")).toBeNull()
    })

    test("returns null for paths already prefixed with /ja", () => {
      expect(getRedirectPathname("/ja")).toBeNull()
      expect(getRedirectPathname("/ja/blog")).toBeNull()
    })
  })
})
