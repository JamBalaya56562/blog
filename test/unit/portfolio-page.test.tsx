import { afterEach, describe, expect, mock, test } from "bun:test"
import { cleanup, render } from "@testing-library/react"
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
import { nextNavigationMock } from "./setup-next-navigation-mock"

mock.module("next/navigation", () => ({
  ...nextNavigationMock,
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND")
  },
}))

const { default: PortfolioPage } = await import("@/app/[locale]/portfolio/page")

// This file renders twice — once per locale — and used to lean on Testing
// Library's automatic cleanup to keep the two apart. That is not dependable
// across a whole `bun test` run: any test file importing a stylesheet (which
// `app/global-error.tsx` must do) leaves a second copy of the library loaded,
// and the automatic hook then belongs to the copy that did not do the render.
// The second locale finds two of every element and the failure names the text,
// not the cause. Every other render test here cleans up explicitly; so does
// this one now.
afterEach(cleanup)

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

      // Contributions section: the featured card, one of the seven that
      // follow it, and the merged count that orders them.
      expect(getByText(dictionary.portfolio.sideProjects)).toBeDefined()
      expect(getByText("Mise")).toBeDefined()
      expect(getByText(dictionary.portfolio.miseDescription)).toBeDefined()
      expect(getByText("FreshRSS")).toBeDefined()
      expect(getByText(dictionary.portfolio.freshrssDescription)).toBeDefined()
      expect(getByText("226")).toBeDefined()
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
