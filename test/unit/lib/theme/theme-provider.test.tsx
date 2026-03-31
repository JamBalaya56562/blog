import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import { act, renderHook } from "@testing-library/react"
import * as fc from "fast-check"
import type { ReactNode } from "react"
import { ThemeProvider } from "@/lib/theme/theme-provider"
import { useTheme } from "@/lib/theme/use-theme"

// --- helpers ---

const themeArb = fc.constantFrom<"light" | "dark">("light", "dark")

let storage: Record<string, string>

function mockLocalStorage() {
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
}

function mockMatchMedia(prefersDark: boolean) {
  Object.defineProperty(globalThis, "matchMedia", {
    value: (query: string) => ({
      matches: query === "(prefers-color-scheme: dark)" ? prefersDark : false,
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
}

function wrapper({ children }: Readonly<{ children: ReactNode }>) {
  return <ThemeProvider>{children}</ThemeProvider>
}

beforeEach(() => {
  mockLocalStorage()
  mockMatchMedia(false)
  document.documentElement.classList.remove("dark")
})

afterEach(() => {
  document.documentElement.classList.remove("dark")
  storage = {}
})

// Unit tests: localStorage failure and invalid value fallback
describe("localStorage fallback behavior", () => {
  test("falls back to system preference when localStorage.getItem throws", () => {
    // Mock localStorage that throws on getItem
    Object.defineProperty(globalThis, "localStorage", {
      value: {
        getItem: () => {
          throw new Error("localStorage access denied")
        },
        setItem: () => {},
        removeItem: () => {},
        clear: () => {},
      },
      writable: true,
      configurable: true,
    })
    mockMatchMedia(true) // system prefers dark

    const { result, unmount } = renderHook(() => useTheme(), { wrapper })
    expect(result.current.theme).toBe("dark")
    unmount()
  })

  test("falls back to system preference when localStorage has invalid value", () => {
    storage = { theme: "invalid" }
    mockMatchMedia(true) // system prefers dark

    const { result, unmount } = renderHook(() => useTheme(), { wrapper })
    expect(result.current.theme).toBe("dark")
    unmount()
  })

  test("falls back to light when localStorage fails and system prefers light", () => {
    Object.defineProperty(globalThis, "localStorage", {
      value: {
        getItem: () => {
          throw new Error("localStorage access denied")
        },
        setItem: () => {},
        removeItem: () => {},
        clear: () => {},
      },
      writable: true,
      configurable: true,
    })
    mockMatchMedia(false) // system prefers light

    const { result, unmount } = renderHook(() => useTheme(), { wrapper })
    expect(result.current.theme).toBe("light")
    unmount()
  })
})

describe("Feature: dark-mode-toggle, Property 1: theme persistence round-trip", () => {
  /**
   * For any theme value ("light" or "dark"), after setting the theme via
   * toggleTheme and re-initialising the provider, the same theme value
   * is restored from localStorage.
   */
  test("saving a theme and re-mounting the provider restores the same theme", () => {
    fc.assert(
      fc.property(themeArb, (targetTheme) => {
        // Reset state
        storage = {}
        document.documentElement.classList.remove("dark")
        // Start with the opposite theme so we always need to toggle
        const oppositeTheme = targetTheme === "light" ? "dark" : "light"
        storage = { theme: oppositeTheme }
        mockMatchMedia(false)

        // 1. Mount provider — it reads oppositeTheme from localStorage
        const { result, unmount } = renderHook(() => useTheme(), { wrapper })
        expect(result.current.theme).toBe(oppositeTheme)

        // 2. Toggle to reach the target theme (always one toggle)
        act(() => {
          result.current.toggleTheme()
        })
        expect(result.current.theme).toBe(targetTheme)

        // 3. Verify localStorage was written by toggleTheme
        expect(storage.theme).toBe(targetTheme)

        // 4. Unmount and re-mount (simulates page reload)
        unmount()
        document.documentElement.classList.remove("dark")

        const { result: result2, unmount: unmount2 } = renderHook(
          () => useTheme(),
          { wrapper },
        )

        // 5. The restored theme must match what was saved
        expect(result2.current.theme).toBe(targetTheme)
        unmount2()
      }),
      { numRuns: 100 },
    )
  })
})

describe("Feature: dark-mode-toggle, Property 2: theme resolution fallback", () => {
  /**
   * For any system theme preference (light or dark), when localStorage
   * has no stored theme, the resolved theme matches the system preference.
   */
  test("without localStorage, theme matches system prefers-color-scheme", () => {
    fc.assert(
      fc.property(fc.boolean(), (prefersDark) => {
        // Reset state — no localStorage value
        storage = {}
        document.documentElement.classList.remove("dark")
        mockMatchMedia(prefersDark)

        const expectedTheme = prefersDark ? "dark" : "light"

        const { result, unmount } = renderHook(() => useTheme(), { wrapper })

        expect(result.current.theme).toBe(expectedTheme)
        unmount()
      }),
      { numRuns: 100 },
    )
  })
})

describe("Feature: dark-mode-toggle, Property 3: toggle involution", () => {
  /**
   * For any initial theme state, calling toggleTheme twice returns
   * the theme to its original value: toggle(toggle(theme)) === theme.
   */
  test("toggling twice returns to the original theme", () => {
    fc.assert(
      fc.property(themeArb, (initialTheme) => {
        // Set up localStorage so provider starts with the desired theme
        storage = { theme: initialTheme }
        document.documentElement.classList.remove("dark")
        mockMatchMedia(false)

        const { result, unmount } = renderHook(() => useTheme(), { wrapper })

        expect(result.current.theme).toBe(initialTheme)

        // Toggle once
        act(() => {
          result.current.toggleTheme()
        })
        expect(result.current.theme).not.toBe(initialTheme)

        // Toggle again — should be back to original
        act(() => {
          result.current.toggleTheme()
        })
        expect(result.current.theme).toBe(initialTheme)

        unmount()
      }),
      { numRuns: 100 },
    )
  })
})
