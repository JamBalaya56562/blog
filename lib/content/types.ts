import type { Locale } from "@/lib/i18n/config"

export interface Frontmatter {
  title: string
  date: string
  /**
   * When the post was last revised. Optional, and absent means never revised —
   * which is not the same as unknown, so a post without it can still state a
   * modified date honestly: the one it was published on.
   */
  updated?: string
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
