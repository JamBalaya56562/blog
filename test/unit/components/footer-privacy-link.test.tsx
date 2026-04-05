import { describe, expect, mock, test } from "bun:test"
import { render } from "@testing-library/react"
import fc from "fast-check"
import { locales } from "@/lib/i18n/config"
import { getDictionary } from "@/lib/i18n/get-dictionary"

mock.module("next/image", () => ({
  default: ({
    alt = "",
    ...props
  }: { alt?: string } & Record<string, unknown>) => (
    <img alt={alt} {...props} />
  ),
}))

const { Footer } = await import("@/components/footer")

describe("Feature: privacy-policy-page, Property 3: フッターリンクの正当性", () => {
  test("For each locale, the Footer privacy policy link href must be /<locale>/privacy-policy and text must match dictionary.footer.privacyPolicy", () => {
    const localeArb = fc.constantFrom(...locales)

    fc.assert(
      fc.property(localeArb, (locale) => {
        const dictionary = getDictionary(locale)
        const { container } = render(
          <Footer locale={locale} dictionary={dictionary} />,
        )

        const link = container.querySelector('a[href*="privacy-policy"]')
        expect(link).not.toBeNull()
        expect(link?.getAttribute("href")).toBe(`/${locale}/privacy-policy`)
        expect(link?.textContent).toBe(dictionary.footer.privacyPolicy)
      }),
      { numRuns: 100 },
    )
  })
})
