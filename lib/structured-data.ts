import type { Locale } from "@/lib/i18n/config"
import { getDictionary } from "@/lib/i18n/get-dictionary"
import { getBlogPostPath } from "@/lib/routes"
import { SITE_AUTHOR, SITE_URL } from "@/lib/site"

const absolute = (path: string) => new URL(path, SITE_URL).href

function person(locale: Locale) {
  return {
    "@type": "Person" as const,
    name: SITE_AUTHOR,
    url: absolute(`/${locale}/portfolio`),
  }
}

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
    updated?: string
    tags: readonly string[]
  },
) {
  const path = getBlogPostPath(locale, post.slug)
  const url = absolute(path)

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    author: person(locale),
    dateModified: new Date(post.updated ?? post.date).toISOString(),
    datePublished: new Date(post.date).toISOString(),
    description: post.description,
    headline: post.title,
    image: cardImage(path),
    inLanguage: locale,
    isPartOf: {
      "@id": absolute(`/${locale}/blog`),
      "@type": "Blog",
      name: getDictionary(locale).blog.title,
    },
    keywords: [...post.tags],
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
