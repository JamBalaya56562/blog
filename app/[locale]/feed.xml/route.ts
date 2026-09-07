import { createContentLoader } from "@/lib/content/loader"
import { buildFeed, FEED_CONTENT_TYPE } from "@/lib/feed"
import { isValidLocale, locales } from "@/lib/i18n/config"
import { getDictionary } from "@/lib/i18n/get-dictionary"

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ locale: string }> },
) {
  const { locale } = await params
  if (!isValidLocale(locale)) {
    return new Response("Not Found", { status: 404 })
  }

  const dictionary = getDictionary(locale)
  const posts = await createContentLoader().getAllPosts(locale)

  return new Response(
    buildFeed({
      description: dictionary.home.description,
      locale,
      posts,
      title: dictionary.header.siteName,
    }),
    { headers: { "Content-Type": FEED_CONTENT_TYPE } },
  )
}
