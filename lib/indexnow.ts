import { SITE_URL } from "@/lib/site"

/**
 * The key search engines check against `public/<key>.txt` before accepting a
 * submission. It proves control of the host, not identity, so it is public by
 * design and lives in the repository.
 */
export const INDEXNOW_KEY = "59a848a6819a4276bbf20e9b24e192a0"

export const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow"

/**
 * Maps every `<loc>` in a sitemap to its `<lastmod>`, or to `undefined` when
 * the entry has none. Only the shape `buildSitemap` produces is supported.
 */
export function parseSitemap(xml: string): Map<string, string | undefined> {
  const entries = new Map<string, string | undefined>()
  for (const [, body] of xml.matchAll(/<url>([\s\S]*?)<\/url>/g)) {
    const loc = body.match(/<loc>([^<]*)<\/loc>/)?.[1]?.trim()
    if (loc) {
      entries.set(loc, body.match(/<lastmod>([^<]*)<\/lastmod>/)?.[1]?.trim())
    }
  }
  return entries
}

/**
 * Whether a saved sitemap can serve as the "before" side of a diff. An error
 * page or a cut-off download would otherwise read as a sitemap that lacked
 * most URLs, and every one of them would be submitted again as new.
 */
export function isCompleteSitemap(xml: string): boolean {
  return xml.trimEnd().endsWith("</urlset>") && parseSitemap(xml).size > 0
}

/**
 * The URLs worth telling search engines about after a deploy: those that are
 * new, and those whose `<lastmod>` moved. Removed URLs are left out, since
 * crawlers find those through the 404 on their own.
 */
export function changedUrls(before: string, after: string): string[] {
  const previous = parseSitemap(before)
  return [...parseSitemap(after)]
    .filter(
      ([loc, lastmod]) => !previous.has(loc) || previous.get(loc) !== lastmod,
    )
    .map(([loc]) => loc)
}

export function submission(urlList: readonly string[]) {
  return {
    host: SITE_URL.host,
    key: INDEXNOW_KEY,
    keyLocation: new URL(`/${INDEXNOW_KEY}.txt`, SITE_URL).href,
    urlList,
  }
}
