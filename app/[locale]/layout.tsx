"use cache"

import type { Metadata } from "next"
import {
  JetBrains_Mono,
  M_PLUS_1_Code,
  Noto_Sans_JP,
  Orbitron,
} from "next/font/google"
import { notFound } from "next/navigation"
import type React from "react"
import { CursorRing } from "@/components/cursor-ring"
import { CyberBackground } from "@/components/cyber-background"
import { Footer } from "@/components/footer"
import { Header } from "@/components/header"
import { ScrollToTop } from "@/components/scroll-to-top"
import { ThemeInitScript } from "@/components/theme-init-script"
import { createContentLoader } from "@/lib/content/loader"
import { isValidLocale, type Locale, locales } from "@/lib/i18n/config"
import { type Dictionary, getDictionary } from "@/lib/i18n/get-dictionary"
import { SITE_URL } from "@/lib/site"
import { ThemeProvider } from "@/lib/theme/theme-provider"
import "@/app/globals.css"

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono-loaded",
  weight: ["300", "400", "500", "700"],
})

const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-orbitron-loaded",
  weight: ["400", "500", "700", "900"],
})

const notoSansJp = Noto_Sans_JP({
  subsets: ["latin"],
  variable: "--font-sans-loaded",
  weight: ["300", "400", "500", "700", "900"],
})

// Japanese-glyph fallback for the monospace stack. JetBrains Mono has no JP
// glyphs, so without this Windows falls through to MS Gothic which looks
// cheap next to the cyberpunk HUD. M PLUS 1 Code is a clean modern mono
// designed to harmonise with Latin coding fonts.
const mPlus1Code = M_PLUS_1_Code({
  subsets: ["latin"],
  variable: "--font-jp-mono-loaded",
  weight: ["400", "500", "700"],
})

export const metadata: Metadata = {
  description: "A blog about web development, built with Next.js and MDX.",
  // Resolves the relative `openGraph.images` paths the post pages hand back.
  // Without it Next falls back to `http://localhost:3000`, so every share
  // card in production pointed at an image nobody else can fetch.
  metadataBase: SITE_URL,
  title: {
    default: "Jam's Blog",
    template: "%s | Jam's Blog",
  },
}

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

async function getMarqueeItems(
  locale: Locale,
  dictionary: Dictionary,
): Promise<string[]> {
  "use cache"
  const loader = createContentLoader()
  const posts = await loader.getAllPosts(locale)

  const items: string[] = []
  if (posts.length > 0) {
    items.push(`${dictionary.ticker.indexed}: ${posts.length}`)
    const latest = posts[0]
    if (latest) {
      items.push(`${dictionary.ticker.latest}: ${latest.frontmatter.title}`)
    }
    const tagCounts = new Map<string, number>()
    for (const p of posts) {
      for (const t of p.frontmatter.tags) {
        tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1)
      }
    }
    const topTags = [...tagCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([t]) => t)
    if (topTags.length > 0) {
      items.push(`${dictionary.ticker.tags}: ${topTags.join(" / ")}`)
    }
  }
  items.push(`${dictionary.ticker.uplink}: STABLE`)
  items.push(`${dictionary.ticker.hue}: AZURE / AMBER`)
  items.push("STATUS: ALL SYSTEMS NOMINAL")
  return items
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode
  params: Promise<{ locale: string }>
}>) {
  const { locale } = await params

  if (!isValidLocale(locale)) {
    notFound()
  }

  const dictionary = getDictionary(locale)
  const tickerItems = await getMarqueeItems(locale, dictionary)

  // next/font css variables are attached to <html> so that the blog font
  // tokens defined in :root (which reference these variables) can resolve
  // at the :root level itself instead of only inside <body>.
  const fontVars = `${jetbrainsMono.variable} ${orbitron.variable} ${notoSansJp.variable} ${mPlus1Code.variable}`

  return (
    <html lang={locale} suppressHydrationWarning className={fontVars}>
      <head>
        <ThemeInitScript />
      </head>
      <body className="relative min-h-screen bg-background text-foreground antialiased">
        <ThemeProvider>
          <CyberBackground />
          <Header
            locale={locale}
            dictionary={dictionary}
            tickerItems={tickerItems}
          />
          <main className="relative z-10">{children}</main>
          <Footer locale={locale} dictionary={dictionary} />
          <ScrollToTop dictionary={dictionary} />
          <CursorRing />
        </ThemeProvider>
      </body>
    </html>
  )
}
