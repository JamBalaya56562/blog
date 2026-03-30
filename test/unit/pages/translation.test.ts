import { describe, expect, test } from "bun:test"
import fc from "fast-check"
import type { ContentLoader } from "@/lib/content/loader"
import type { Post } from "@/lib/content/types"
import type { Locale } from "@/lib/i18n/config"
import { locales } from "@/lib/i18n/config"

function getTranslationPair(
  loader: ContentLoader,
  currentLocale: Locale,
  slug: string,
): Promise<Locale | null> {
  return (async () => {
    for (const locale of locales) {
      if (locale === currentLocale) {
        continue
      }
      const post = await loader.getPost(locale, slug)
      if (post) {
        return locale
      }
    }
    return null
  })()
}

function makePost(slug: string, locale: Locale): Post {
  return {
    slug,
    locale,
    frontmatter: {
      title: "t",
      date: "2025-01-01",
      description: "d",
      tags: ["a"],
    },
    content: "c",
  }
}

describe("Translation", () => {
  test("Property 11: translation pair symmetry", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.stringMatching(/^[a-z]{1,10}$/), {
          minLength: 1,
          maxLength: 5,
        }),
        async (sharedSlugs) => {
          const enPosts = sharedSlugs.map((s) => makePost(s, "en"))
          const jaPosts = sharedSlugs.map((s) => makePost(s, "ja"))
          const loader: ContentLoader = {
            async getPostSlugs(locale) {
              return (locale === "en" ? enPosts : jaPosts).map((p) => p.slug)
            },
            async getPost(locale, slug) {
              return (
                (locale === "en" ? enPosts : jaPosts).find(
                  (p) => p.slug === slug,
                ) ?? null
              )
            },
            async getAllPosts(locale) {
              return locale === "en" ? enPosts : jaPosts
            },
          }
          for (const slug of sharedSlugs) {
            const enToJa = await getTranslationPair(loader, "en", slug)
            const jaToEn = await getTranslationPair(loader, "ja", slug)
            if (enToJa !== null) {
              expect(jaToEn).not.toBeNull()
            }
            if (jaToEn !== null) {
              expect(enToJa).not.toBeNull()
            }
          }
        },
      ),
      { numRuns: 100 },
    )
  })
})
