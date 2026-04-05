import { describe, expect, mock, test } from "bun:test"
import { render } from "@testing-library/react"
import { locales } from "@/lib/i18n/config"
import { getDictionary } from "@/lib/i18n/get-dictionary"

// Mock next/image to avoid URL resolution errors in Happy DOM
mock.module("next/image", () => ({
  default: ({
    priority: _priority,
    alt = "",
    ...props
  }: Record<string, unknown>) => <img alt={alt as string} {...props} />,
}))

// Mock next/navigation
mock.module("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND")
  },
}))

const { default: PortfolioPage } = await import("@/app/[locale]/portfolio/page")

describe("Portfolio Page", () => {
  for (const locale of locales) {
    test(`renders in ${locale} locale`, async () => {
      const dictionary = getDictionary(locale)
      const page = await PortfolioPage({
        params: Promise.resolve({ locale }),
      })
      const { getByText, getByAltText } = render(page)

      // Hero section
      expect(getByText("Jam Balaya")).toBeDefined()
      expect(getByText(dictionary.portfolio.subtitle)).toBeDefined()
      expect(getByAltText(dictionary.portfolio.title)).toBeDefined()

      // Bio section
      expect(getByText(dictionary.portfolio.bioTitle)).toBeDefined()
      expect(getByText(dictionary.portfolio.bioText1)).toBeDefined()

      // Tech Stack section
      expect(getByText(dictionary.portfolio.techCore)).toBeDefined()
      expect(getByText("TypeScript")).toBeDefined()

      // Connectivity card
      expect(getByText(dictionary.portfolio.quickConnectivity)).toBeDefined()
      expect(getByText(dictionary.portfolio.github)).toBeDefined()

      // Quote card
      expect(getByText(dictionary.portfolio.quoteText)).toBeDefined()
      expect(getByText(dictionary.portfolio.quoteAuthor)).toBeDefined()

      // Projects section
      expect(getByText(dictionary.portfolio.sideProjects)).toBeDefined()
      expect(getByText("blog")).toBeDefined()
    })
  }
})

describe("Portfolio Dictionary Keys", () => {
  test("en.json and ja.json have identical portfolio keys", () => {
    const enDict = getDictionary("en")
    const jaDict = getDictionary("ja")
    const enKeys = Object.keys(enDict.portfolio).sort()
    const jaKeys = Object.keys(jaDict.portfolio).sort()
    expect(enKeys).toEqual(jaKeys)
  })
})
