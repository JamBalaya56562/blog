import type { Metadata } from "next"
import type React from "react"
import { SITE_URL } from "@/lib/site"

export const metadata: Metadata = {
  metadataBase: SITE_URL,
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children
}
