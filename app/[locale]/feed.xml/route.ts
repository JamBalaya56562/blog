import { createContentLoader } from "@/lib/content/loader"
import { buildFeed, FEED_CACHE_CONTROL, FEED_CONTENT_TYPE } from "@/lib/feed"
import { isValidLocale, type Locale, locales } from "@/lib/i18n/config"
import { getDictionary } from "@/lib/i18n/get-dictionary"

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

async function feedFor(locale: Locale): Promise<string> {
  "use cache"
  const dictionary = getDictionary(locale)
  const posts = await createContentLoader().getAllPosts(locale)

  return buildFeed({
    description: dictionary.home.description,
    locale,
    posts,
    title: dictionary.header.siteName,
  })
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ locale: string }> },
) {
  const { locale } = await params
  if (!isValidLocale(locale)) {
    return new Response("Not Found", { status: 404 })
  }

  return new Response(await feedFor(locale), {
    headers: {
      "Cache-Control": FEED_CACHE_CONTROL,
      "Content-Type": FEED_CONTENT_TYPE,
    },
  })
}
