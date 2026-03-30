"use client"

import { usePathname } from "next/navigation"
import type { Locale } from "@/lib/i18n/config"

/**
 * A link that switches the locale while preserving the current page path.
 */
export function LocaleSwitchLink({
  currentLocale,
  targetLocale,
  children,
  className,
}: Readonly<{
  currentLocale: Locale
  targetLocale: Locale
  children: React.ReactNode
  className?: string
}>) {
  const pathname = usePathname()
  const href = pathname
    ? pathname.replace(`/${currentLocale}`, `/${targetLocale}`)
    : `/${targetLocale}`

  return (
    <a href={href} className={className}>
      {children}
    </a>
  )
}
