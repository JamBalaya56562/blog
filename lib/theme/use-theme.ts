"use client"

import { use } from "react"
import type { ThemeContextValue } from "@/lib/theme/theme-provider"
import { ThemeContext } from "@/lib/theme/theme-provider"

export function useTheme(): ThemeContextValue {
  const context = use(ThemeContext)
  if (!context) {
    throw new Error(
      "useTheme must be used within a ThemeProvider. " +
        "Wrap your component tree with <ThemeProvider>.",
    )
  }
  return context
}
