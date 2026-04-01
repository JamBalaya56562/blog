import type { Route } from "next"
import type { Locale } from "@/lib/i18n/config"

export function getBlogPostPath(locale: Locale, slug: string) {
  return `/${locale}/blog/${slug}` as Route
}
