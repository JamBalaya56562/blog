import { ImageResponse } from "next/og"
import { createContentLoader } from "@/lib/content/loader"
import { defaultLocale, isValidLocale, locales } from "@/lib/i18n/config"
import { OG_CONTENT_TYPE, OG_SIZE, OgCard } from "@/lib/og/card"

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

export default async function Image({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  const resolved = isValidLocale(locale) ? locale : defaultLocale
  const post = await createContentLoader().getPost(resolved, slug)
  return new ImageResponse(
    <OgCard
      title={post?.frontmatter.title ?? "Jam's Blog"}
      description={post?.frontmatter.description ?? ""}
    />,
    OG_SIZE,
  )
}
