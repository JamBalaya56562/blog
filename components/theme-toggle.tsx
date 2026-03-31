"use client"

import type { Dictionary } from "@/lib/i18n/get-dictionary"
import { useTheme } from "@/lib/theme/use-theme"

export function ThemeToggle({
  dictionary,
}: Readonly<{ dictionary: Dictionary }>) {
  const { theme, toggleTheme, mounted } = useTheme()

  // Render a static placeholder until client-side hydration completes
  // to avoid a mismatch between server ("light") and client (localStorage value)
  if (!mounted) {
    return (
      <button
        type="button"
        aria-label="Toggle theme"
        className="rounded border border-gray-300 px-2 py-1 text-sm text-foreground hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-800"
      >
        🌙
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={
        theme === "dark"
          ? dictionary.theme.switchToLight
          : dictionary.theme.switchToDark
      }
      className="rounded border border-gray-300 px-2 py-1 text-sm text-foreground hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-800"
    >
      {theme === "dark" ? "☀️" : "🌙"}
    </button>
  )
}
