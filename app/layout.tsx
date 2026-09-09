import type { Metadata } from "next"
import type React from "react"
import { SITE_URL } from "@/lib/site"

/**
 * `metadataBase` sits here, apart from every other metadata field, because
 * this is the one layout that is not `"use cache"`.
 *
 * It belongs in `app/[locale]/layout.tsx` with the rest, and that is where it
 * was. That file is cached, so what its `generateMetadata` returns is
 * serialized into a cache entry, and a `URL` does not survive that as itself:
 * React takes its `toJSON` and reports the substitution on every render.
 *
 *   Only plain objects can be passed to Client Components from Server
 *   Components. URL objects are not supported.
 *
 * The href that came out still resolved the relative `openGraph.images`
 * correctly, which is why no share card was ever wrong, but the warning could
 * not be answered in place: `metadataBase` is typed `URL | null`, so it cannot
 * be handed over as the string it was going to become anyway.
 *
 * This layout renders no markup of its own — `app/[locale]/layout.tsx` is the
 * document root — and metadata resolves down the whole segment tree, so the
 * base still reaches every page from here.
 */
export const metadata: Metadata = {
  metadataBase: SITE_URL,
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children
}
