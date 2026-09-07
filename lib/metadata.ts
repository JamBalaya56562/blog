import type { Metadata } from "next"
import { isValidLocale } from "@/lib/i18n/config"
import { localeAlternates } from "@/lib/site"

export function localeAlternatesMetadata(path: string) {
  return async ({
    params,
  }: {
    params: Promise<{ locale: string }>
  }): Promise<Metadata> => {
    const { locale } = await params
    if (!isValidLocale(locale)) {
      return {}
    }
    return { alternates: localeAlternates(locale, path) }
  }
}
