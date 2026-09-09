import type { MetadataRoute } from "next"
import { createContentLoader } from "@/lib/content/loader"
import { type Locale, locales } from "@/lib/i18n/config"
import { SITE_URL } from "@/lib/site"

const STATIC_PATHS = ["", "/blog", "/portfolio", "/privacy-policy"] as const

function absolute(locale: Locale, path: string): string {
  return new URL(`/${locale}${path}`, SITE_URL).href
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const loader = createContentLoader()
  const byLocale = await Promise.all(
    locales.map(
      async (locale) => [locale, await loader.getAllPosts(locale)] as const,
    ),
  )

  const posts = new Map<string, { locales: Locale[]; date: string }>()
  for (const [locale, localePosts] of byLocale) {
    for (const post of localePosts) {
      const existing = posts.get(post.slug)
      if (existing) {
        existing.locales.push(locale)
      } else {
        posts.set(post.slug, {
          date: post.frontmatter.date,
          locales: [locale],
        })
      }
    }
  }

  const languagesFor = (available: readonly Locale[], path: string) =>
    Object.fromEntries(
      available.map((locale) => [locale, absolute(locale, path)]),
    )

  const staticEntries = STATIC_PATHS.flatMap((path) =>
    locales.map((locale) => ({
      alternates: { languages: languagesFor(locales, path) },
      url: absolute(locale, path),
    })),
  )

  const postEntries = [...posts.entries()].flatMap(([slug, post]) =>
    post.locales.map((locale) => ({
      alternates: {
        languages: languagesFor(post.locales, `/blog/${slug}`),
      },
      lastModified: new Date(post.date),
      url: absolute(locale, `/blog/${slug}`),
    })),
  )

  return [...staticEntries, ...postEntries]
}
