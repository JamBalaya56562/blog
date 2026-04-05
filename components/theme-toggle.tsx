"use client"

import { Moon, Sun } from "lucide-react"
import type { Dictionary } from "@/lib/i18n/get-dictionary"
import { useTheme } from "@/lib/theme/use-theme"

export function ThemeToggle({
  dictionary,
}: Readonly<{ dictionary: Dictionary }>) {
  const { theme, toggleTheme, mounted } = useTheme()

  if (!mounted) {
    return (
      <button
        type="button"
        aria-label={dictionary.theme.switchToDark}
        className="rounded px-2 py-1 text-foreground hover:bg-gray-100 dark:hover:bg-gray-800"
      >
        <Moon size={18} className="text-indigo-400" fill="currentColor" />
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
      className="rounded px-2 py-1 text-foreground hover:bg-gray-100 dark:hover:bg-gray-800"
    >
      {theme === "dark" ? (
        <Sun size={18} className="text-amber-400" fill="currentColor" />
      ) : (
        <Moon size={18} className="text-indigo-400" fill="currentColor" />
      )}
    </button>
  )
}
