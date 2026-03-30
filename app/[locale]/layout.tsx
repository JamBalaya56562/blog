import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { notFound } from "next/navigation"
import type React from "react"
import { Suspense } from "react"
import { Footer } from "@/components/footer"
import { Header } from "@/components/header"
import { isValidLocale } from "@/lib/i18n/config"
import { getDictionary } from "@/lib/i18n/get-dictionary"
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
    default: "Jam's Blog",
    template: "%s | Jam's Blog",
  },
  description: "A blog about web development, built with Next.js and MDX.",
}

async function LocaleContent({
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

  return (
    <>
      <Header locale={locale} dictionary={dictionary} />
      <main className="mx-auto max-w-3xl px-4 py-8">{children}</main>
      <Footer dictionary={dictionary} />
    </>
  )
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode
  params: Promise<{ locale: string }>
}>) {
  const { locale } = await params
  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-background text-foreground antialiased`}
      >
        <Suspense>
          <LocaleContent params={params}>{children}</LocaleContent>
        </Suspense>
      </body>
    </html>
  )
}
