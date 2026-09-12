"use cache"

import type { Metadata, Viewport } from "next"
import { notFound } from "next/navigation"
import type React from "react"
import { CursorRing } from "@/components/cursor-ring"
import { CyberBackground } from "@/components/cyber-background"
import { Footer } from "@/components/footer"
import { Header } from "@/components/header"
import { ScrollToTop } from "@/components/scroll-to-top"
import { ThemeInitScript } from "@/components/theme-init-script"
import { TocProvider } from "@/components/toc-context"
import { createContentLoader } from "@/lib/content/loader"
import { fontVars } from "@/lib/fonts"
import {
  defaultLocale,
  isValidLocale,
  type Locale,
  locales,
} from "@/lib/i18n/config"
import { type Dictionary, getDictionary } from "@/lib/i18n/get-dictionary"
import { THEME_BACKGROUND } from "@/lib/theme/colors"
import { ThemeProvider } from "@/lib/theme/theme-provider"
import "@/app/globals.css"

export const viewport: Viewport = {
  themeColor: [
    { color: THEME_BACKGROUND.light, media: "(prefers-color-scheme: light)" },
    { color: THEME_BACKGROUND.dark, media: "(prefers-color-scheme: dark)" },
  ],
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const siteName = getDictionary(isValidLocale(locale) ? locale : defaultLocale)
    .header.siteName

  return {
    description: "A blog about web development, built with Next.js and MDX.",
    title: {
      default: siteName,
      template: `%s | ${siteName}`,
    },
  }
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

  return (
    <html lang={locale} suppressHydrationWarning className={fontVars}>
      <head>
        <ThemeInitScript />
      </head>
      <body className="relative min-h-screen bg-background text-foreground antialiased">
        <ThemeProvider>
          <TocProvider>
            <a
              href="#main"
              className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:border focus:border-cyber-cyan focus:bg-cyber-bg-0 focus:px-4 focus:py-2 focus:font-mono focus:text-sm focus:text-cyber-cyan"
            >
              {dictionary.nav.skipToContent}
            </a>
            <CyberBackground />
            <Header
              locale={locale}
              dictionary={dictionary}
              tickerItems={tickerItems}
            />
            <main id="main" tabIndex={-1} className="relative z-10">
              {children}
            </main>
            <Footer locale={locale} dictionary={dictionary} />
            <ScrollToTop dictionary={dictionary} />
            <CursorRing />
          </TocProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
