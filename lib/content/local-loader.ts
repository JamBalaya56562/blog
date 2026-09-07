import { readdir, readFile } from "node:fs/promises"
import { join } from "node:path"
import type { Locale } from "@/lib/i18n/config"
import { BaseContentLoader } from "./base-loader"
import { parseFrontmatter } from "./frontmatter"
import type { Post } from "./types"

export class LocalContentLoader extends BaseContentLoader {
  private basePath: string

  constructor(basePath = "content/posts") {
    super()
    this.basePath = basePath
  }

  async getPostSlugs(locale: Locale): Promise<string[]> {
    const dir = join(
      /*turbopackIgnore: true*/ process.cwd(),
      this.basePath,
      locale,
    )
    try {
      const files = await readdir(/*turbopackIgnore: true*/ dir)
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
      return { content, frontmatter, locale, slug }
    } catch {
      return null
    }
  }
}
