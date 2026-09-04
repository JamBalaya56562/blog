import { type Locale, locales } from "@/lib/i18n/config"

/**
 * Canonical origin of the deployed site.
 *
 * Metadata fields that need a fully qualified URL — `openGraph.images` above
 * all — are written as relative paths, and Next resolves them against
 * `metadataBase`. With no base set it falls back to `http://localhost:3000`
 * and warns at build time, which is how every production share card ended up
 * pointing at a localhost image.
 *
 * `next.config.ts` names the same host in `serverActions.allowedOrigins`.
 */
export const SITE_URL = new URL("https://kokohore56562wanwan.site")

/**
 * `alternates` for a page: a self-referencing canonical plus the hreflang set.
 *
 * Without `languages`, `/en/blog/x` and `/ja/blog/x` look like two unrelated
 * pages to a crawler rather than one document in two languages. `available`
 * exists because a post written in only one locale must not advertise a URL
 * that 404s — pass the locales that actually have it.
 *
 * `path` is the part after the locale segment, so `""` for a locale root.
 * Query variants (`?tag=`, `?q=`, `?page=`) are deliberately absent: they
 * collapse onto the unfiltered page, which is right while the list fits on
 * one page. Revisit when it does not.
 */
export function localeAlternates(
  locale: Locale,
  path: string,
  available: readonly Locale[] = locales,
) {
  const href = (target: Locale) => new URL(`/${target}${path}`, SITE_URL).href
  return {
    canonical: href(locale),
    languages: Object.fromEntries(
      available.map((target) => [target, href(target)]),
    ),
  }
}
