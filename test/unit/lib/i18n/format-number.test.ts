import { describe, expect, test } from "bun:test"
import fc from "fast-check"
import { locales } from "@/lib/i18n/config"
import { formatCount } from "@/lib/i18n/format-number"

describe("formatCount", () => {
  test("groups by the page's locale", () => {
    expect(formatCount("en", 1234567)).toBe("1,234,567")
    expect(formatCount("ja", 1234567)).toBe("1,234,567")
  })

  test("is Intl's own format for the locale, whatever the runtime default", () => {
    fc.assert(
      fc.property(fc.constantFrom(...locales), fc.nat(), (locale, value) => {
        expect(formatCount(locale, value)).toBe(
          new Intl.NumberFormat(locale).format(value),
        )
      }),
    )
  })
})
