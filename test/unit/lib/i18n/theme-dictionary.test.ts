import { describe, expect, test } from "bun:test"
import * as fc from "fast-check"
import { locales } from "@/lib/i18n/config"
import { getDictionary } from "@/lib/i18n/get-dictionary"

describe("Feature: dark-mode-toggle, Property 5: dictionary completeness for all locales", () => {
  /**
   * For every supported locale, the dictionary contains theme.switchToLight
   * and theme.switchToDark keys, each being a non-empty string.
   */
  test("all locales have non-empty theme.switchToLight and theme.switchToDark", () => {
    const localeArb = fc.constantFrom(...locales)

    fc.assert(
      fc.property(localeArb, (locale) => {
        const dictionary = getDictionary(locale)

        expect(typeof dictionary.theme.switchToLight).toBe("string")
        expect(dictionary.theme.switchToLight.length).toBeGreaterThan(0)

        expect(typeof dictionary.theme.switchToDark).toBe("string")
        expect(dictionary.theme.switchToDark.length).toBeGreaterThan(0)
      }),
      { numRuns: 100 },
    )
  })
})
