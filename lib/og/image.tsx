import { ImageResponse } from "next/og"
import { defaultLocale, isValidLocale } from "@/lib/i18n/config"
import { type Dictionary, getDictionary } from "@/lib/i18n/get-dictionary"
import { OG_SIZE, OgCard, ogEyebrow } from "./card"

export function localeOgImage(
  select: (dictionary: Dictionary) => { title: string; description: string },
) {
  return async ({ params }: { params: Promise<{ locale: string }> }) => {
    const { locale } = await params
    const dictionary = getDictionary(
      isValidLocale(locale) ? locale : defaultLocale,
    )
    const { title, description } = select(dictionary)
    return new ImageResponse(
      <OgCard
        title={title}
        description={description}
        eyebrow={ogEyebrow(dictionary.header.siteName)}
      />,
      OG_SIZE,
    )
  }
}
