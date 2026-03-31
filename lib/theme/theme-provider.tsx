"use client"

import { createContext, useCallback, useEffect, useState } from "react"

type Theme = "light" | "dark"

export interface ThemeContextValue {
  theme: Theme
  toggleTheme: () => void
  mounted: boolean
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)

function resolveSystemTheme(): Theme {
  if (typeof window !== "undefined" && window.matchMedia) {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light"
  }
  return "light"
}

function readStoredTheme(): Theme | null {
  try {
    const stored = localStorage.getItem("theme")
    if (stored === "light" || stored === "dark") {
      return stored
    }
  } catch {
    // localStorage inaccessible (e.g. private browsing)
  }
  return null
}

function applyThemeClass(theme: Theme) {
  if (theme === "dark") {
    document.documentElement.classList.add("dark")
  } else {
    document.documentElement.classList.remove("dark")
  }
}

export function ThemeProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [theme, setTheme] = useState<Theme>("light")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const resolved = readStoredTheme() ?? resolveSystemTheme()
    setTheme(resolved)
    applyThemeClass(resolved)
    setMounted(true)
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next: Theme = prev === "light" ? "dark" : "light"
      applyThemeClass(next)
      try {
        localStorage.setItem("theme", next)
      } catch {
        // localStorage inaccessible
      }
      return next
    })
  }, [])

  return (
    <ThemeContext value={{ theme, toggleTheme, mounted }}>
      {children}
    </ThemeContext>
  )
}
