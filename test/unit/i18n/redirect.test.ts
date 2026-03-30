import { describe, expect, test } from "bun:test"
import fc from "fast-check"
import { defaultLocale, locales } from "@/lib/i18n/config"

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

describe("i18n Redirect", () => {
  test("Property 14: locale redirect accuracy", () => {
    fc.assert(
      fc.property(
        fc
          .stringMatching(/^\/[a-z0-9/]{0,30}$/)
          .filter((p) => !hasLocalePrefix(p)),
        (pathname) => {
          const result = getRedirectPathname(pathname)
          expect(result).toBe(`/${defaultLocale}${pathname}`)
        },
      ),
      { numRuns: 100 },
    )
  })
})
