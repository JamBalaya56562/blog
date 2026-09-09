import type { MetadataRoute } from "next"
import { createContentLoader } from "@/lib/content/loader"
import { locales } from "@/lib/i18n/config"
import { buildSitemap } from "@/lib/sitemap"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  "use cache"
  const loader = createContentLoader()
  const byLocale = await Promise.all(
    locales.map(
      async (locale) => [locale, await loader.getAllPosts(locale)] as const,
    ),
  )

  return buildSitemap(byLocale)
}
