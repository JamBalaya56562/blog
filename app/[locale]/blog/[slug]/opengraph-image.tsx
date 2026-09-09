import { ImageResponse } from "next/og"
import { createContentLoader } from "@/lib/content/loader"
import {
  defaultLocale,
  isValidLocale,
  type Locale,
  locales,
} from "@/lib/i18n/config"
import { getDictionary } from "@/lib/i18n/get-dictionary"
import { OG_CONTENT_TYPE, OG_SIZE, OgCard, ogEyebrow } from "@/lib/og/card"

export const alt = "Jam's Blog"
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export async function generateStaticParams() {
  const loader = createContentLoader()
  const params: { locale: string; slug: string }[] = []
  for (const locale of locales) {
    const slugs = await loader.getPostSlugs(locale)
    for (const slug of slugs) {
      params.push({ locale, slug })
    }
  }
  return params
}

async function cardText(locale: Locale, slug: string) {
  "use cache"
  const post = await createContentLoader().getPost(locale, slug)
  const dictionary = getDictionary(locale)
  return {
    description: post?.frontmatter.description ?? "",
    eyebrow: ogEyebrow(dictionary.header.siteName),
    title: post?.frontmatter.title ?? dictionary.header.siteName,
  }
}

export default async function Image({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  const resolved = isValidLocale(locale) ? locale : defaultLocale
  const { title, description, eyebrow } = await cardText(resolved, slug)
  return new ImageResponse(
    <OgCard title={title} description={description} eyebrow={eyebrow} />,
    OG_SIZE,
  )
}
