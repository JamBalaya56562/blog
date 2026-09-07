import type { Metadata } from "next"
import { isValidLocale } from "@/lib/i18n/config"
import { type Dictionary, getDictionary } from "@/lib/i18n/get-dictionary"
import { localeAlternates } from "@/lib/site"

type Select = (dictionary: Dictionary) => string

export function localePageMetadata(
  path: string,
  text: { title?: Select; description?: Select } = {},
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
    const dictionary = getDictionary(locale)
    const metadata: Metadata = { alternates: localeAlternates(locale, path) }
    if (text.title) {
      metadata.title = text.title(dictionary)
    }
    if (text.description) {
      metadata.description = text.description(dictionary)
    }
    return metadata
  }
}
