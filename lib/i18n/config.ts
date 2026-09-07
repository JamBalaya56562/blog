export const locales = ["en", "ja"] as const

export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = "en"

export function isValidLocale(value: string): value is Locale {
  return locales.includes(value as Locale)
}

const OG_LOCALES: Record<Locale, string> = {
  en: "en_US",
  ja: "ja_JP",
}

export function ogLocale(locale: Locale): string {
  return OG_LOCALES[locale]
}

export function alternateOgLocales(locale: Locale): string[] {
  return locales.filter((other) => other !== locale).map(ogLocale)
}
