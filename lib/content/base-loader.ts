import type { Locale } from "@/lib/i18n/config"
import type { ContentLoader } from "./loader"
import { sortPostsByDate } from "./sort-filter"
import type { Post } from "./types"

export abstract class BaseContentLoader implements ContentLoader {
  abstract getPostSlugs(locale: Locale): Promise<string[]>

  abstract getPost(locale: Locale, slug: string): Promise<Post | null>

  async getAllPosts(locale: Locale): Promise<Post[]> {
    const slugs = await this.getPostSlugs(locale)
    const posts = await Promise.all(
      slugs.map((slug) => this.getPost(locale, slug)),
    )
    return sortPostsByDate(posts.filter((post) => post !== null))
  }
}
