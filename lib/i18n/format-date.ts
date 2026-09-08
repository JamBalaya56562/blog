import type { Locale } from "@/lib/i18n/config"

/**
 * The site prints dates as `2025.03.01`, which a screen reader reads as the
 * digits and the dots — "two thousand twenty-five point zero three point zero
 * one" — because nothing in the markup says it is a date.
 *
 * `<time datetime>` does not fix that: assistive technology announces the
 * visible text, not the attribute. Nor does `aria-label`, which ARIA prohibits
 * on both the `generic` role a bare `<span>` has and the `time` role. The only
 * thing that changes what is announced is different text, which is what
 * `components/post-date.tsx` renders beside the visible one.
 *
 * UTC is pinned deliberately. The frontmatter carries a bare `2025-03-01`,
 * which `Date` reads as UTC midnight; formatting that in a timezone behind UTC
 * would print the previous day, so the date a reader hears would disagree with
 * the one they see.
 */
export function spokenDate(locale: Locale, isoDate: string): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(new Date(isoDate))
}

/** The visible form: `2025-03-01` becomes `2025.03.01`. */
export function displayDate(isoDate: string): string {
  return isoDate.replace(/-/g, ".")
}
