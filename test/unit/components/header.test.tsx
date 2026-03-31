import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test"
import { render } from "@testing-library/react"
import fc from "fast-check"
import type { ReactNode } from "react"
import { locales } from "@/lib/i18n/config"
import { getDictionary } from "@/lib/i18n/get-dictionary"
import { ThemeProvider } from "@/lib/theme/theme-provider"

// Mock next/navigation before importing Header (which imports LocaleSwitchLink)
const pathnameMock = { value: "/en" }
mock.module("next/navigation", () => ({
  usePathname: () => pathnameMock.value,
}))

const { Header } = await import("@/components/header")

function wrapper({ children }: Readonly<{ children: ReactNode }>) {
  return <ThemeProvider>{children}</ThemeProvider>
}

beforeEach(() => {
  Object.defineProperty(globalThis, "localStorage", {
    value: {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
    },
    writable: true,
    configurable: true,
  })
  Object.defineProperty(globalThis, "matchMedia", {
    value: (query: string) => ({
      matches: false,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      onchange: null,
      dispatchEvent: () => false,
    }),
    writable: true,
    configurable: true,
  })
  document.documentElement.classList.remove("dark")
})

afterEach(() => {
  document.documentElement.classList.remove("dark")
})

describe("Header", () => {
  test("ThemeToggle button exists in Header", () => {
    const dictionary = getDictionary("en")
    pathnameMock.value = "/en"
    const { getByRole } = render(
      <Header locale="en" dictionary={dictionary} />,
      { wrapper },
    )
    const button = getByRole("button")
    expect(button).toBeDefined()
    expect(button.getAttribute("aria-label")).toBe(
      dictionary.theme.switchToDark,
    )
  })

  test("Property 9: navigation link locale prefix consistency", () => {
    fc.assert(
      fc.property(fc.constantFrom(...locales), (locale) => {
        pathnameMock.value = `/${locale}`
        const dictionary = getDictionary(locale)
        const { container } = render(
          <Header locale={locale} dictionary={dictionary} />,
          { wrapper },
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
