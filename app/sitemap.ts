import type { MetadataRoute } from "next"
import { createContentLoader } from "@/lib/content/loader"
import { type Locale, locales } from "@/lib/i18n/config"
import { SITE_URL } from "@/lib/site"

/** Pages that exist for every locale regardless of what has been written. */
const STATIC_PATHS = ["", "/blog", "/portfolio", "/privacy-policy"] as const

function absolute(locale: Locale, path: string): string {
  return new URL(`/${locale}${path}`, SITE_URL).href
}

/**
 * Serves `/sitemap.xml`, which until now was a 404.
 *
 * Next writes the XML; the entries come from the content itself, so a new
 * post is listed the moment it is added rather than when someone remembers
 * to update a list.
 *
 * Every entry carries `alternates.languages`, which is how the two locales
 * are declared to be the same document rather than two unrelated pages. Only
 * locales that actually have the post are listed: a post written in one
 * language and not the other would otherwise advertise a URL that 404s.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const loader = createContentLoader()
  const byLocale = await Promise.all(
    locales.map(
      async (locale) => [locale, await loader.getAllPosts(locale)] as const,
    ),
  )

  /** slug -> the locales it was actually written in, and its date. */
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
