import type { MetadataRoute } from "next"
import type { Post } from "@/lib/content/types"
import { type Locale, locales } from "@/lib/i18n/config"
import { SITE_URL } from "@/lib/site"

const STATIC_PATHS = ["", "/blog", "/portfolio", "/privacy-policy"] as const

function absolute(locale: Locale, path: string): string {
  return new URL(`/${locale}${path}`, SITE_URL).href
}

function languagesFor(
  available: readonly Locale[],
  path: string,
): Record<string, string> {
  return Object.fromEntries(
    available.map((locale) => [locale, absolute(locale, path)]),
  )
}

export function buildSitemap(
  byLocale: readonly (readonly [Locale, readonly Post[]])[],
): MetadataRoute.Sitemap {
  const posts = new Map<string, Map<Locale, string>>()
  for (const [locale, localePosts] of byLocale) {
    for (const post of localePosts) {
      const modified = post.frontmatter.updated ?? post.frontmatter.date
      const existing = posts.get(post.slug)
      if (existing) {
        existing.set(locale, modified)
      } else {
        posts.set(post.slug, new Map([[locale, modified]]))
      }
    }
  }

  const staticEntries = STATIC_PATHS.flatMap((path) =>
    locales.map((locale) => ({
      alternates: { languages: languagesFor(locales, path) },
      url: absolute(locale, path),
    })),
  )

  const postEntries = [...posts.entries()].flatMap(
    ([slug, modifiedByLocale]) => {
      const available = [...modifiedByLocale.keys()]
      return [...modifiedByLocale].map(([locale, modified]) => ({
        alternates: {
          languages: languagesFor(available, `/blog/${slug}`),
        },
        lastModified: new Date(modified),
        url: absolute(locale, `/blog/${slug}`),
      }))
    },
  )

  return [...staticEntries, ...postEntries]
}
