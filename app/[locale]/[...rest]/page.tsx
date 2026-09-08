import { notFound } from "next/navigation"

/**
 * Every unmatched path under a locale, so that the 404 a reader actually hits
 * is the one #1164 wrote.
 *
 * Without this route nothing under `app/[locale]/` matches `/en/typo`, so the
 * miss escapes the segment entirely and Next answers with its built-in
 * "This page could not be found." That page renders outside
 * `app/[locale]/layout.tsx`, which is where the fonts, the header and footer,
 * `CyberBackground` and `ThemeInitScript` all live — so it arrived with no
 * site chrome, in English regardless of locale, and following the OS colour
 * scheme rather than the theme the reader chose. `app/[locale]/not-found.tsx`
 * existed the whole time; only `notFound()` calls from inside the segment,
 * such as an unknown post slug, ever reached it.
 *
 * A catch-all is the lowest-priority match in the router, so every real route
 * beside it — `blog`, `portfolio`, `privacy-policy`, `feed.xml` and the
 * `opengraph-image` handlers — still wins on its own path.
 *
 * `proxy.ts` sends locale-less paths here too: `/typo` is redirected to
 * `/en/typo` before routing. The exception is a path containing a dot, which
 * the proxy matcher skips, so `/missing.png` keeps the built-in page. That is
 * left alone deliberately: those are asset requests, and answering one with a
 * full HTML page would be the wrong reply.
 */
/**
 * The same declaration `app/[locale]/blog/[slug]/page.tsx` carries, for the
 * same reason: this route answers 404 and nothing else, so there is no shell
 * worth streaming ahead of that decision.
 *
 * Without it `cacheComponents` tries to validate `instant` against a segment
 * that never renders — `notFound()` throws before anything is produced — and
 * dev logs "Could not validate `instant`" on every 404. Production was
 * unaffected, which is exactly what makes it worth pinning down here.
 */
export const instant = false

export default function CatchAllNotFound(): never {
  notFound()
}
