import { describe, expect, mock, test } from "bun:test"
import { render } from "@testing-library/react"
import fc from "fast-check"
import { locales } from "@/lib/i18n/config"
import { getDictionary } from "@/lib/i18n/get-dictionary"

// Mock next/navigation before importing Header (which imports LocaleSwitchLink)
mock.module("next/navigation", () => ({
  usePathname: () => "/en",
}))

const { Header } = await import("@/components/header")

describe("Header", () => {
  test("Property 9: navigation link locale prefix consistency", () => {
    fc.assert(
      fc.property(fc.constantFrom(...locales), (locale) => {
        const dictionary = getDictionary(locale)
        const { container } = render(
          <Header locale={locale} dictionary={dictionary} />,
        )
        const links = container.querySelectorAll("a")
        for (const link of links) {
          const href = link.getAttribute("href")
          if (href && !href.startsWith("http")) {
            const hasLocalePrefix = locales.some(
              (l) => href === `/${l}` || href.startsWith(`/${l}/`),
            )
            expect(hasLocalePrefix).toBe(true)
          }
        }
      }),
      { numRuns: locales.length * 2 },
    )
  })
})
