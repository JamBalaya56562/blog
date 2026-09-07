import type { MetadataRoute } from "next"
import { defaultLocale } from "@/lib/i18n/config"
import { getDictionary } from "@/lib/i18n/get-dictionary"
import { THEME_BACKGROUND } from "@/lib/theme/colors"

export default function manifest(): MetadataRoute.Manifest {
  const { siteName } = getDictionary(defaultLocale).header

  return {
    background_color: THEME_BACKGROUND.light,
    description: "A blog about web development, built with Next.js and MDX.",
    display: "standalone",
    icons: [
      {
        sizes: "192x192",
        src: "/icon-192x192.png",
        type: "image/png",
      },
      {
        sizes: "512x512",
        src: "/icon-512x512.png",
        type: "image/png",
      },
    ],
    name: siteName,
    short_name: siteName,
    start_url: "/",
    theme_color: THEME_BACKGROUND.light,
  }
}
