import type { Locale } from "@/lib/i18n/config"
import { getDictionary } from "@/lib/i18n/get-dictionary"
import { getBlogPostPath } from "@/lib/routes"
import { SITE_AUTHOR, SITE_URL } from "@/lib/site"

/**
 * Open Graph and structured data look like the same job and are not. A crawler
 * reads Open Graph to build a share card; Google reads schema.org to build a
 * search result, and ignores Open Graph for that entirely. The site had a
 * complete set of the first and none of the second, so everything #1161 added
 * stopped at the edge of a social post.
 *
 * The strings all come from the same places the metadata uses — the dictionary
 * for names, `lib/site.ts` for the origin — so a page cannot describe itself
 * one way to a crawler and another way to a reader.
 */

const absolute = (path: string) => new URL(path, SITE_URL).href

/**
 * `url` points at the portfolio rather than the origin. It is the page that
 * actually describes this person, and `/` is a redirect to the default locale —
 * a crawler following it from a Japanese page would land in English.
 */
function person(locale: Locale) {
  return {
    "@type": "Person" as const,
    name: SITE_AUTHOR,
    url: absolute(`/${locale}/portfolio`),
  }
}

/**
 * The card image is the route Next generates from `opengraph-image.tsx`, the
 * same picture the share card uses. Google wants an image it can crop, and
 * pointing at a second one would mean maintaining two.
 */
const cardImage = (path: string) => absolute(`${path}/opengraph-image`)

export function websiteJsonLd(locale: Locale) {
  const dictionary = getDictionary(locale)
  const url = absolute(`/${locale}`)

  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    author: person(locale),
    description: dictionary.home.description,
    image: cardImage(`/${locale}`),
    inLanguage: locale,
    name: dictionary.header.siteName,
    publisher: person(locale),
    url,
  }
}

export function blogPostingJsonLd(
  locale: Locale,
  post: {
    slug: string
    title: string
    description: string
    date: string
    tags: readonly string[]
  },
) {
  const path = getBlogPostPath(locale, post.slug)
  const url = absolute(path)

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    author: person(locale),
    // Repeats `datePublished` because the frontmatter has no updated field to
    // read. That is true today — nothing has been revised — and stops being
    // true the first time a post is edited, so an `updated` field has to land
    // before that happens rather than after.
    dateModified: new Date(post.date).toISOString(),
    datePublished: new Date(post.date).toISOString(),
    description: post.description,
    headline: post.title,
    image: cardImage(path),
    inLanguage: locale,
    // Ties the post to the blog it belongs to, so the posts read as one
    // publication rather than three unrelated pages that share an origin.
    isPartOf: {
      "@id": absolute(`/${locale}/blog`),
      "@type": "Blog",
      name: getDictionary(locale).blog.title,
    },
    keywords: [...post.tags],
    // This is what says the markup describes the page it sits on rather than
    // something the page merely mentions. Without it the block is a floating
    // description of an article that lives somewhere else.
    mainEntityOfPage: { "@id": url, "@type": "WebPage" },
    publisher: person(locale),
    url,
  }
}

function breadcrumbJsonLd(trail: readonly { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((crumb, index) => ({
      "@type": "ListItem",
      item: absolute(crumb.path),
      name: crumb.name,
      position: index + 1,
    })),
  }
}

export function postBreadcrumb(locale: Locale, slug: string, title: string) {
  const dictionary = getDictionary(locale)
  return breadcrumbJsonLd([
    { name: dictionary.nav.home, path: `/${locale}` },
    { name: dictionary.nav.blog, path: `/${locale}/blog` },
    { name: title, path: getBlogPostPath(locale, slug) },
  ])
}
