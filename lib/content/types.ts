import type { Locale } from "@/lib/i18n/config"

export interface Frontmatter {
  title: string
  date: string
  description: string
  tags: string[]
  image?: string
}

export interface Post {
  slug: string
  locale: Locale
  frontmatter: Frontmatter
  content: string
}
