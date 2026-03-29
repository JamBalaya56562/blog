import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { notFound } from "next/navigation"
import type React from "react"
import { isValidLocale } from "@/lib/i18n/config"
import "@/app/globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: {
    default: "JamBalaya's Blog",
    template: "%s | JamBalaya's Blog",
  },
  description: "A blog about web development, built with Next.js and MDX.",
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

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-background text-foreground antialiased`}
      >
        {children}
      </body>
    </html>
  )
}
