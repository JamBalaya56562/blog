import { defaultLocale, type Locale, locales } from "@/lib/i18n/config"

export const SITE_URL = new URL("https://kokohore56562wanwan.site")

export const SITE_AUTHOR = "Jam Balaya"

export function feedPath(locale: Locale): string {
  return `/${locale}/feed.xml`
}

export function feedUrl(locale: Locale): string {
  return new URL(feedPath(locale), SITE_URL).href
}

export function localeAlternates(
  locale: Locale,
  path: string,
  available: readonly Locale[] = locales,
) {
  const href = (target: Locale) => new URL(`/${target}${path}`, SITE_URL).href
  const languages: Record<string, string> = Object.fromEntries(
    available.map((target) => [target, href(target)]),
  )
  if (available.includes(defaultLocale)) {
    languages["x-default"] = new URL(path, SITE_URL).href
  }

  return {
    canonical: href(locale),
    languages,
    types: { "application/rss+xml": feedUrl(locale) },
  }
}
