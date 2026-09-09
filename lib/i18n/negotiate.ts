import { defaultLocale, type Locale, locales } from "@/lib/i18n/config"

export function hasLocalePrefix(pathname: string): boolean {
  return locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  )
}

export function preferredLocale(header: string | null): Locale {
  if (!header) {
    return defaultLocale
  }

  const ranked = header
    .split(",")
    .map((entry) => {
      const [tag, ...params] = entry.trim().split(";")
      const quality = params
        .map((param) => param.trim())
        .find((param) => param.startsWith("q="))
      const parsed = quality ? Number.parseFloat(quality.slice(2)) : 1

      return {
        quality: Number.isFinite(parsed) ? parsed : 0,
        tag: (tag ?? "").trim().toLowerCase(),
      }
    })
    .filter((entry) => entry.tag.length > 0 && entry.quality > 0)
    .sort((a, b) => b.quality - a.quality)

  for (const { tag } of ranked) {
    if (tag === "*") {
      return defaultLocale
    }
    const base = tag.split("-")[0]
    const match = locales.find((locale) => locale === tag || locale === base)
    if (match) {
      return match
    }
  }

  return defaultLocale
}
