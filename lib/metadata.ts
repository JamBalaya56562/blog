import type { Metadata } from "next"
import { isValidLocale } from "@/lib/i18n/config"
import { type Dictionary, getDictionary } from "@/lib/i18n/get-dictionary"
import { localeAlternates } from "@/lib/site"

export function localePageMetadata(
  path: string,
  title?: (dictionary: Dictionary) => string,
) {
  return async ({
    params,
  }: {
    params: Promise<{ locale: string }>
  }): Promise<Metadata> => {
    const { locale } = await params
    if (!isValidLocale(locale)) {
      return {}
    }
    const alternates = localeAlternates(locale, path)
    if (!title) {
      return { alternates }
    }
    return { alternates, title: title(getDictionary(locale)) }
  }
}
