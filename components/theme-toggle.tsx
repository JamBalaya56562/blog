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
        className="flex h-7 w-7 items-center justify-center border border-cyber-line text-cyber-dim"
      >
        <Moon size={14} />
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
      className="flex h-7 w-7 items-center justify-center border border-cyber-line text-cyber-dim transition-colors hover:border-cyber-cyan hover:text-cyber-cyan"
    >
      {theme === "dark" ? (
        <Sun size={14} className="text-cyber-amber" fill="currentColor" />
      ) : (
        <Moon size={14} />
      )}
    </button>
  )
}
