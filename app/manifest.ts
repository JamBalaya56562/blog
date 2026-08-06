import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    background_color: "#fff",
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
    name: "Jam Blog",
    short_name: "Jam Blog",
    start_url: "/",
    theme_color: "#fff",
  }
}
