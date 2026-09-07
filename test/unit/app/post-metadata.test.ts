import { describe, expect, mock, test } from "bun:test"
import { LocalContentLoader } from "@/lib/content/local-loader"
import { locales } from "@/lib/i18n/config"
import { SITE_AUTHOR } from "@/lib/site"

import { nextNavigationMock } from "../setup-next-navigation-mock"

mock.module("next/navigation", () => ({
  ...nextNavigationMock,
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND")
  },
}))

const { generateMetadata } = await import("@/app/[locale]/blog/[slug]/page")
const SLUG = "tailwind-css-v4-guide"

type OgFields = {
  type?: string
  url?: string
  siteName?: string
  locale?: string
  alternateLocale?: string[]
  publishedTime?: string
  authors?: unknown
  tags?: unknown
}

function og(metadata: { openGraph?: unknown }): OgFields {
  return (metadata.openGraph ?? {}) as OgFields
}

function canonicalOf(metadata: {
  alternates?: { canonical?: unknown } | null
}): string {
  return String(metadata.alternates?.canonical)
}

describe("post Open Graph metadata", () => {
  for (const locale of locales) {
    test(`${locale} declares the post an article`, async () => {
      const metadata = await generateMetadata({
        params: Promise.resolve({ locale, slug: SLUG }),
      })
      expect(og(metadata).type).toBe("article")
    })

    // A crawler that cannot date a post cannot order a feed of them, and the
    // date lives in frontmatter as "2025-03-01" rather than as a timestamp.
    test(`${locale} publishes the frontmatter date as an ISO timestamp`, async () => {
      const post = await new LocalContentLoader().getPost(locale, SLUG)
      const metadata = await generateMetadata({
        params: Promise.resolve({ locale, slug: SLUG }),
      })
      const published = og(metadata).publishedTime
      expect(published).toBe(
        new Date(post?.frontmatter.date ?? "").toISOString(),
      )
      expect(published).toContain("T")
    })

    test(`${locale} carries the author and the post's tags`, async () => {
      const post = await new LocalContentLoader().getPost(locale, SLUG)
      const fields = og(
        await generateMetadata({
          params: Promise.resolve({ locale, slug: SLUG }),
        }),
      )
      expect(fields.authors).toEqual([SITE_AUTHOR])
      expect(fields.tags).toEqual(post?.frontmatter.tags)
    })

    test(`${locale} points og:url at its own canonical`, async () => {
      const metadata = await generateMetadata({
        params: Promise.resolve({ locale, slug: SLUG }),
      })
      expect(og(metadata).url).toBe(canonicalOf(metadata))
      expect(og(metadata).url).toBe(
        `https://kokohore56562wanwan.site/${locale}/blog/${SLUG}`,
      )
    })
  }

  test("a missing post still yields no metadata", async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ locale: "en", slug: "does-not-exist" }),
    })
    expect(metadata).toEqual({})
  })
})
