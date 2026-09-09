import type { Post } from "@/lib/content/types"
import type { Locale } from "@/lib/i18n/config"
import { feedUrl, SITE_URL } from "@/lib/site"

export const FEED_CONTENT_TYPE = "application/rss+xml; charset=utf-8"

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

function modifiedAt(post: Post): string {
  return post.frontmatter.updated ?? post.frontmatter.date
}

function item(locale: Locale, post: Post): string {
  const link = new URL(`/${locale}/blog/${post.slug}`, SITE_URL).href
  const { date, description, title, updated } = post.frontmatter
  return [
    "    <item>",
    `      <title>${escapeXml(title)}</title>`,
    `      <link>${escapeXml(link)}</link>`,
    `      <guid isPermaLink="true">${escapeXml(link)}</guid>`,
    `      <pubDate>${new Date(date).toUTCString()}</pubDate>`,
    ...(updated
      ? [
          `      <atom:updated>${new Date(updated).toISOString()}</atom:updated>`,
        ]
      : []),
    `      <description>${escapeXml(description)}</description>`,
    "    </item>",
  ].join("\n")
}

export function buildFeed({
  locale,
  title,
  description,
  posts,
}: Readonly<{
  locale: Locale
  title: string
  description: string
  posts: readonly Post[]
}>): string {
  const home = new URL(`/${locale}`, SITE_URL).href
  const modified = posts
    .map((post) => Date.parse(modifiedAt(post)))
    .filter((time) => Number.isFinite(time))
  return [
    '<?xml version="1.0" encoding="utf-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    "  <channel>",
    `    <title>${escapeXml(title)}</title>`,
    `    <link>${escapeXml(home)}</link>`,
    `    <description>${escapeXml(description)}</description>`,
    `    <language>${locale}</language>`,
    `    <atom:link href="${escapeXml(feedUrl(locale))}" rel="self" type="application/rss+xml" />`,
    ...(modified.length > 0
      ? [
          `    <lastBuildDate>${new Date(Math.max(...modified)).toUTCString()}</lastBuildDate>`,
        ]
      : []),
    ...posts.map((post) => item(locale, post)),
    "  </channel>",
    "</rss>",
    "",
  ].join("\n")
}
