import type { Locale } from "@/lib/i18n/config"

const formatters = new Map<Locale, Intl.NumberFormat>()

/**
 * A count grouped the way the page's language groups it. `toLocaleString()`
 * with no argument takes the browser's language instead, so an English page
 * read in a German browser showed "1.234", and the server, formatting the
 * same figure in its own language, could disagree with the client that
 * hydrated it.
 */
export function formatCount(locale: Locale, value: number): string {
  let formatter = formatters.get(locale)
  if (!formatter) {
    formatter = new Intl.NumberFormat(locale)
    formatters.set(locale, formatter)
  }
  return formatter.format(value)
}
