import type { Locale } from "@/lib/i18n/config"

export function spokenDate(locale: Locale, isoDate: string): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(new Date(isoDate))
}

export function displayDate(isoDate: string): string {
  return isoDate.replace(/-/g, ".")
}
