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
    content: "c",
    frontmatter: {
      date: "2025-01-01",
      description: "d",
      tags: ["a"],
      title: "t",
    },
    locale,
    slug,
  }
}

describe("Translation", () => {
  test("Property 11: translation pair symmetry", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.stringMatching(/^[a-z]{1,10}$/), {
          maxLength: 5,
          minLength: 1,
        }),
        async (sharedSlugs) => {
          const enPosts = sharedSlugs.map((s) => makePost(s, "en"))
          const jaPosts = sharedSlugs.map((s) => makePost(s, "ja"))
          const loader: ContentLoader = {
            async getAllPosts(locale) {
              return locale === "en" ? enPosts : jaPosts
            },
            async getPost(locale, slug) {
              return (
                (locale === "en" ? enPosts : jaPosts).find(
                  (p) => p.slug === slug,
                ) ?? null
              )
            },
            async getPostSlugs(locale) {
              return (locale === "en" ? enPosts : jaPosts).map((p) => p.slug)
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

  /**
   * A post written in one language only must report no pair, so the page
   * omits the "also available in" line and hreflang omits that locale.
   *
   * This used to be covered end to end by `tailwind-css-v4-guide`, which
   * existed only in English. It is now translated, so no content exercises
   * the case any more and the e2e that relied on the gap is gone.
   */
  test("a post that exists in one locale only has no translation pair", async () => {
    const enOnly = [makePost("only-english", "en")]
    const loader: ContentLoader = {
      async getAllPosts(locale) {
        return locale === "en" ? enOnly : []
      },
      async getPost(locale, slug) {
        return locale === "en"
          ? (enOnly.find((p) => p.slug === slug) ?? null)
          : null
      },
      async getPostSlugs(locale) {
        return locale === "en" ? enOnly.map((p) => p.slug) : []
      },
    }

    expect(await getTranslationPair(loader, "en", "only-english")).toBeNull()
    expect(await getTranslationPair(loader, "ja", "only-english")).toBe("en")
  })
})
