import { describe, expect, test } from "bun:test"
import * as fc from "fast-check"
import { locales } from "@/lib/i18n/config.ts"
import { getDictionary } from "@/lib/i18n/get-dictionary.ts"

describe("Feature: privacy-policy-page, Property 1: 辞書の完全性", () => {
  test("For all locales, privacyPolicy.title, privacyPolicy.body, and footer.privacyPolicy must be non-empty strings", () => {
    const localeArb = fc.constantFrom(...locales)

    fc.assert(
      fc.property(localeArb, (locale) => {
        const dictionary = getDictionary(locale)

        expect(typeof dictionary.privacyPolicy.title).toBe("string")
        expect(dictionary.privacyPolicy.title.length).toBeGreaterThan(0)

        expect(typeof dictionary.privacyPolicy.body).toBe("string")
        expect(dictionary.privacyPolicy.body.length).toBeGreaterThan(0)

        expect(typeof dictionary.footer.privacyPolicy).toBe("string")
        expect(dictionary.footer.privacyPolicy.length).toBeGreaterThan(0)
      }),
      { numRuns: 100 },
    )
  })
})

describe("Feature: privacy-policy-page, Property 2: 辞書の構造的一貫性", () => {
  test("For all locale pairs, the key set of the privacyPolicy section must be identical", () => {
    const localePairArb = fc
      .tuple(fc.constantFrom(...locales), fc.constantFrom(...locales))
      .filter(([a, b]) => a !== b)

    fc.assert(
      fc.property(localePairArb, ([localeA, localeB]) => {
        const dictA = getDictionary(localeA)
        const dictB = getDictionary(localeB)

        const keysA = Object.keys(dictA.privacyPolicy).sort()
        const keysB = Object.keys(dictB.privacyPolicy).sort()

        expect(keysA).toEqual(keysB)
      }),
      { numRuns: 100 },
    )
  })
})
