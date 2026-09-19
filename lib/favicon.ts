import { SITE_URL } from "@/lib/site"

/**
 * A host name as it appears in a URL: labels of letters, digits and hyphens,
 * joined by dots, at least two of them. `URL` has already lower-cased and
 * punycoded it, so this is the whole alphabet the route has to accept.
 */
const HOSTNAME = /^[a-z0-9-]+(?:\.[a-z0-9-]+)+$/

export function isHostname(host: string): boolean {
  return HOSTNAME.test(host)
}

/**
 * The host a link leaves the site for, or nothing when it stays: a relative
 * path, an anchor, a mailto, or an absolute URL back to this site. Only a
 * link that leaves gets a favicon.
 */
export function externalHost(href: string | undefined): string | null {
  if (!href) {
    return null
  }
  let url: URL
  try {
    url = new URL(href)
  } catch {
    return null
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return null
  }
  if (url.hostname === SITE_URL.hostname || !isHostname(url.hostname)) {
    return null
  }
  return url.hostname
}

export function faviconPath(host: string): string {
  return `/api/favicons/${host}`
}

/**
 * Where the favicon is fetched from. Google's service resolves the icon a
 * site declares and falls back to a globe when it has none, so every host
 * gets a picture and the page never shows a broken image.
 */
export function faviconSource(host: string): string {
  return `https://www.google.com/s2/favicons?domain=${host}&sz=32`
}
