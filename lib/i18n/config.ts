export const locales = ["en", "ja"] as const

export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = "en"

export function isValidLocale(value: string): value is Locale {
  return locales.includes(value as Locale)
}
