import { describe, expect, test } from "bun:test"
import fc from "fast-check"
import { defaultLocale, locales } from "@/lib/i18n/config"
import { hasLocalePrefix, preferredLocale } from "@/lib/i18n/negotiate"

/**
 * This file used to re-implement `hasLocalePrefix` and the redirect target so
 * it could avoid importing Next's request types. A copy of the logic passes
 * whether or not the real one still agrees with it — and the real one had
 * meanwhile been sending every reader to `/en`. Both functions now live in
 * `lib/i18n/negotiate.ts`, which `proxy.ts` is a thin adapter over, so the
 * assertions below are about the code that runs.
 */
describe("hasLocalePrefix", () => {
  test("a locale root and anything under it is already placed", () => {
    for (const locale of locales) {
      expect(hasLocalePrefix(`/${locale}`)).toBe(true)
      expect(hasLocalePrefix(`/${locale}/blog`)).toBe(true)
      expect(hasLocalePrefix(`/${locale}/blog/my-post`)).toBe(true)
    }
  })

  test("the root and unprefixed paths are not", () => {
    expect(hasLocalePrefix("/")).toBe(false)
    expect(hasLocalePrefix("/blog")).toBe(false)
    expect(hasLocalePrefix("/blog/my-post")).toBe(false)
  })

  // `/english` starts with `/en` as a string but is not the English tree.
  test("a path that merely begins with a locale's letters is not", () => {
    expect(hasLocalePrefix("/english")).toBe(false)
    expect(hasLocalePrefix("/japan")).toBe(false)
  })
})

/**
 * The redirect ignored `Accept-Language` entirely, so a Japanese reader typing
 * the domain landed on the English site and had to find the JA / EN switch.
 * `/` is what hreflang names `x-default`, which is exactly the URL that is
 * supposed to decide.
 */
describe("preferredLocale", () => {
  test("a Japanese browser gets Japanese", () => {
    expect(preferredLocale("ja")).toBe("ja")
    expect(preferredLocale("ja-JP,ja;q=0.9,en;q=0.5")).toBe("ja")
    expect(preferredLocale("ja,en;q=0.8")).toBe("ja")
  })

  test("an English browser gets English", () => {
    expect(preferredLocale("en-US,en;q=0.9")).toBe("en")
  })

  // Quality decides, not order in the header.
  test("the highest quality wins over position", () => {
    expect(preferredLocale("en;q=0.5,ja;q=0.9")).toBe("ja")
    expect(preferredLocale("ja;q=0.4,en;q=0.8")).toBe("en")
  })

  test("a language we do not publish falls back", () => {
    expect(preferredLocale("fr-FR,fr;q=0.9")).toBe(defaultLocale)
    expect(preferredLocale("zh-Hans,zh;q=0.9")).toBe(defaultLocale)
    expect(preferredLocale("*")).toBe(defaultLocale)
  })

  test("a rejected language is not chosen even when it is the only one", () => {
    expect(preferredLocale("ja;q=0")).toBe(defaultLocale)
  })

  test("no header, an empty one, or nonsense falls back", () => {
    expect(preferredLocale(null)).toBe(defaultLocale)
    expect(preferredLocale("")).toBe(defaultLocale)
    expect(preferredLocale(";;;")).toBe(defaultLocale)
    expect(preferredLocale("ja;q=abc")).toBe(defaultLocale)
  })

  // A header is attacker-controlled input, and the result indexes a route.
  test("it always answers with a locale we publish", () => {
    fc.assert(
      fc.property(fc.string(), (header) => {
        expect(locales).toContain(preferredLocale(header))
      }),
      { numRuns: 200 },
    )
  })
})
