import { readdir, readFile } from "node:fs/promises"
import { join } from "node:path"
import type { Locale } from "@/lib/i18n/config"
import { parseFrontmatter } from "./frontmatter"
import type { ContentLoader } from "./loader"
import { sortPostsByDate } from "./sort-filter"
import type { Post } from "./types"

export class LocalContentLoader implements ContentLoader {
  private basePath: string

  constructor(basePath = "content/posts") {
    this.basePath = basePath
  }

  async getPostSlugs(locale: Locale): Promise<string[]> {
    const dir = join(process.cwd(), this.basePath, locale)
    try {
      const files = await readdir(dir)
      return files
        .filter((f) => f.endsWith(".mdx"))
        .map((f) => f.replace(/\.mdx$/, ""))
    } catch {
      return []
    }
  }

  async getPost(locale: Locale, slug: string): Promise<Post | null> {
    const filePath = join(process.cwd(), this.basePath, locale, `${slug}.mdx`)
    try {
      const raw = await readFile(filePath, "utf-8")
      const { frontmatter, content } = parseFrontmatter(raw)
      return { slug, locale, frontmatter, content }
    } catch {
      return null
    }
  }

  async getAllPosts(locale: Locale): Promise<Post[]> {
    const slugs = await this.getPostSlugs(locale)
    const posts = await Promise.all(
      slugs.map((slug) => this.getPost(locale, slug)),
    )
    return sortPostsByDate(posts.filter(Boolean) as Post[])
  }
}
