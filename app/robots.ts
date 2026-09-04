import type { MetadataRoute } from "next"
import { SITE_URL } from "@/lib/site"

/**
 * Served at `/robots.txt`, which until now was a 404.
 *
 * Nothing here is private — the whole site is content — so the only job is
 * pointing crawlers at the sitemap they would otherwise have to discover by
 * following links.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      allow: "/",
      userAgent: "*",
    },
    sitemap: new URL("/sitemap.xml", SITE_URL).href,
  }
}
