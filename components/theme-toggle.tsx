"use client"

import type { Dictionary } from "@/lib/i18n/get-dictionary"
import { useTheme } from "@/lib/theme/use-theme"

/**
 * Theme switch. Both icons are always in the markup; which one is shown is a
 * rotate-and-scale crossfade driven by `data-theme` in globals.css, so the
 * swap reads as one object turning over rather than two icons blinking.
 */
export function ThemeToggle({
  dictionary,
}: Readonly<{ dictionary: Dictionary }>) {
  const { theme, toggleTheme, mounted } = useTheme()

  const shell =
    "pp-tg h-7 w-7 border border-cyber-line text-cyber-dim transition-colors hover:border-cyber-cyan hover:text-cyber-cyan"

  if (!mounted) {
    return (
      <button
        type="button"
        disabled
        aria-label={dictionary.theme.switchToDark}
        className={shell}
      >
        <MoonIcon />
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      data-theme={theme}
      aria-label={
        theme === "dark"
          ? dictionary.theme.switchToLight
          : dictionary.theme.switchToDark
      }
      className={shell}
    >
      <span aria-hidden className="pp-tg-ripple" />
      <SunIcon />
      <MoonIcon />
    </button>
  )
}

function SunIcon() {
  return (
    <svg
      aria-hidden
      className="pp-tg-sun text-cyber-amber"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="12" cy="12" r="4" fill="currentColor" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg
      aria-hidden
      className="pp-tg-moon"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />
    </svg>
  )
}
