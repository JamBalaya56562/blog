import type { Metadata } from "next"
import {
  alternateOgLocales,
  isValidLocale,
  type Locale,
  ogLocale,
} from "@/lib/i18n/config"
import { type Dictionary, getDictionary } from "@/lib/i18n/get-dictionary"
import { OG_CONTENT_TYPE, OG_SIZE } from "@/lib/og/card"
import { localeAlternates } from "@/lib/site"

type Select = (dictionary: Dictionary) => string

export function ogImages(canonical: string, alt: string) {
  return [
    {
      alt,
      height: OG_SIZE.height,
      type: OG_CONTENT_TYPE,
      url: `${canonical}/opengraph-image`,
      width: OG_SIZE.width,
    },
  ]
}

export function openGraphSite(locale: Locale, url: string) {
  return {
    alternateLocale: alternateOgLocales(locale),
    locale: ogLocale(locale),
    siteName: getDictionary(locale).header.siteName,
    url,
  }
}

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
    const alternates = localeAlternates(locale, path)
    const title = text.title?.(dictionary)
    const description = text.description?.(dictionary)

    const resolved = {
      ...(title === undefined ? {} : { title }),
      ...(description === undefined ? {} : { description }),
    }

    return {
      alternates,
      ...resolved,
      openGraph: {
        ...openGraphSite(locale, alternates.canonical),
        ...resolved,
        images: ogImages(
          alternates.canonical,
          title ?? dictionary.header.siteName,
        ),
        type: "website",
      },
    }
  }
}
