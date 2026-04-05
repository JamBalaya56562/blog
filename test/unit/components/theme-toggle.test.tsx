import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test"
import { cleanup, render } from "@testing-library/react"
import * as fc from "fast-check"
import type { ReactNode } from "react"
import { locales } from "@/lib/i18n/config"
import { getDictionary } from "@/lib/i18n/get-dictionary"
import { ThemeProvider } from "@/lib/theme/theme-provider"

// Mock next/navigation before importing ThemeToggle
mock.module("next/navigation", () => ({
  usePathname: () => "/en",
}))

const { ThemeToggle } = await import("@/components/theme-toggle")

let storage: Record<string, string> = {}

beforeEach(() => {
  storage = {}
  Object.defineProperty(globalThis, "localStorage", {
    value: {
      getItem: (key: string) => storage[key] ?? null,
      setItem: (key: string, value: string) => {
        storage[key] = value
      },
      removeItem: (key: string) => {
        delete storage[key]
      },
      clear: () => {
        storage = {}
      },
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
  cleanup()
  document.documentElement.classList.remove("dark")
  storage = {}
})

describe("ThemeToggle icon display", () => {
  test("light mode shows moon icon (🌙)", () => {
    cleanup()
    document.documentElement.classList.remove("dark")
    storage = { theme: "light" }

    const dictionary = getDictionary("en")

    function Wrapper({ children }: Readonly<{ children: ReactNode }>) {
      return <ThemeProvider>{children}</ThemeProvider>
    }

    const { getByRole } = render(
      <Wrapper>
        <ThemeToggle dictionary={dictionary} />
      </Wrapper>,
    )

    const button = getByRole("button")
    expect(button.querySelector("svg")).toBeDefined()
    expect(button.getAttribute("aria-label")).toBe(
      dictionary.theme.switchToDark,
    )
  })

  test("dark mode shows sun icon (☀️)", () => {
    cleanup()
    document.documentElement.classList.remove("dark")
    storage = { theme: "dark" }

    const dictionary = getDictionary("en")

    function Wrapper({ children }: Readonly<{ children: ReactNode }>) {
      return <ThemeProvider>{children}</ThemeProvider>
    }

    const { getByRole } = render(
      <Wrapper>
        <ThemeToggle dictionary={dictionary} />
      </Wrapper>,
    )

    const button = getByRole("button")
    expect(button.querySelector("svg")).toBeDefined()
    expect(button.getAttribute("aria-label")).toBe(
      dictionary.theme.switchToLight,
    )
  })
})

describe("Feature: dark-mode-toggle, Property 4: localized aria-label correctness", () => {
  /**
   * For any locale × theme combination, the ThemeToggle's aria-label
   * matches the corresponding dictionary value:
   *   dark  → theme.switchToLight
   *   light → theme.switchToDark
   */
  test("aria-label matches dictionary for every locale × theme combination", () => {
    const localeArb = fc.constantFrom(...locales)
    const themeArb = fc.constantFrom<"light" | "dark">("light", "dark")

    fc.assert(
      fc.property(localeArb, themeArb, (locale, theme) => {
        // Clean up previous render
        cleanup()
        document.documentElement.classList.remove("dark")

        // Set localStorage so provider initialises with the desired theme
        storage.theme = theme

        const dictionary = getDictionary(locale)

        const expectedLabel =
          theme === "dark"
            ? dictionary.theme.switchToLight
            : dictionary.theme.switchToDark

        function Wrapper({ children }: Readonly<{ children: ReactNode }>) {
          return <ThemeProvider>{children}</ThemeProvider>
        }

        const { getByRole } = render(
          <Wrapper>
            <ThemeToggle dictionary={dictionary} />
          </Wrapper>,
        )

        const button = getByRole("button")
        expect(button.getAttribute("aria-label")).toBe(expectedLabel)
      }),
      { numRuns: 100 },
    )
  })
})
