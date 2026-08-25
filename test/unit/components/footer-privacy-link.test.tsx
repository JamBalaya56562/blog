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
      // The input domain is `locales` (2 values), so 100 runs re-tests the same
      // inputs ~50x each without adding coverage. Each run does a full React
      // render of Footer, which pushed this test past bun's 5s default timeout
      // on the QEMU-emulated linux/arm64 stage of the Docker build (~20x slower
      // than native).
      { numRuns: 10 },
    )
  })
})
