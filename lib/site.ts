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
