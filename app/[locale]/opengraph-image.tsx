import { locales } from "@/lib/i18n/config"
import { OG_CONTENT_TYPE, OG_SIZE } from "@/lib/og/card"
import { localeOgImage } from "@/lib/og/image"

export const alt = "Jam's Blog"
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export default localeOgImage((d) => ({
  description: d.home.description,
  title: d.home.tagline,
}))
