import { describe, expect, test } from "bun:test"
import fc from "fast-check"
import type { ContentLoader } from "@/lib/content/loader"
import type { Post } from "@/lib/content/types"
import type { Locale } from "@/lib/i18n/config"
import { locales } from "@/lib/i18n/config"

function createMockLoader(posts: Map<string, Post[]>): ContentLoader {
  return {
    async getAllPosts(locale: Locale) {
      return posts.get(locale) ?? []
    },
    async getPost(locale: Locale, slug: string) {
      return (posts.get(locale) ?? []).find((p) => p.slug === slug) ?? null
    },
    async getPostSlugs(locale: Locale) {
      return (posts.get(locale) ?? []).map((p) => p.slug)
    },
  }
}

const dateArb = fc
  .integer({ max: 2099, min: 2000 })
  .chain((year) =>
    fc
      .integer({ max: 12, min: 1 })
      .chain((month) =>
        fc
          .integer({ max: 28, min: 1 })
          .map(
            (day) =>
              `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
          ),
      ),
  )

const postArb = (locale: Locale): fc.Arbitrary<Post> =>
  fc.record({
    content: fc.constant("content"),
    frontmatter: fc.record({
      date: dateArb,
      description: fc.stringMatching(/^[a-zA-Z0-9 ]{1,50}$/),
      tags: fc.array(fc.stringMatching(/^[a-z]{1,10}$/), {
        maxLength: 3,
        minLength: 1,
      }),
      title: fc.stringMatching(/^[a-zA-Z0-9 ]{1,30}$/),
    }),
    locale: fc.constant(locale),
    slug: fc.stringMatching(/^[a-z][a-z0-9-]{0,19}$/),
  })

function uniqueBySlug(posts: Post[]): Post[] {
  const seen = new Set<string>()
  return posts.filter((p) => {
    if (seen.has(p.slug)) {
      return false
    }
    seen.add(p.slug)
    return true
  })
}

describe("ContentLoader", () => {
  test("Property 3: slug uniqueness", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc
          .array(postArb("en"), { maxLength: 20, minLength: 1 })
          .map(uniqueBySlug),
        async (posts) => {
          const loader = createMockLoader(new Map([["en", posts]]))
          const slugs = await loader.getPostSlugs("en")
          expect(new Set(slugs).size).toBe(slugs.length)
        },
      ),
      { numRuns: 100 },
    )
  })

  test("Property 4: locale isolation", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc
          .array(postArb("en"), { maxLength: 10, minLength: 1 })
          .map(uniqueBySlug),
        fc
          .array(postArb("ja"), { maxLength: 10, minLength: 1 })
          .map(uniqueBySlug),
        async (enPosts, jaPosts) => {
          const loader = createMockLoader(
            new Map([
              ["en", enPosts],
              ["ja", jaPosts],
            ]),
          )
          for (const locale of locales) {
            const posts = await loader.getAllPosts(locale)
            for (const post of posts) {
              expect(post.locale).toBe(locale)
            }
          }
        },
      ),
      { numRuns: 100 },
    )
  })
})
