import type { Locale } from "@/lib/i18n/config"
import { BaseContentLoader } from "./base-loader"
import { parseFrontmatter } from "./frontmatter"
import type { Post } from "./types"

export class GitHubContentLoader extends BaseContentLoader {
  private owner: string
  private repo: string
  private branch: string
  private contentPath: string

  constructor() {
    super()
    this.owner = process.env.GITHUB_OWNER ?? ""
    this.repo = process.env.GITHUB_REPO ?? ""
    this.branch = process.env.GITHUB_BRANCH ?? "main"
    this.contentPath = process.env.GITHUB_CONTENT_PATH ?? "content"
  }

  private rawUrl(path: string): string {
    return `https://raw.githubusercontent.com/${this.owner}/${this.repo}/${this.branch}/${path}`
  }

  private apiUrl(path: string): string {
    return `https://api.github.com/repos/${this.owner}/${this.repo}/contents/${path}?ref=${this.branch}`
  }

  async getPostSlugs(locale: Locale): Promise<string[]> {
    const url = this.apiUrl(`${this.contentPath}/posts/${locale}`)
    try {
      const res = await fetch(url, {
        next: { revalidate: 3600 },
      } as RequestInit)
      if (!res.ok) {
        console.error(`GitHub API error: ${res.status} for ${url}`)
        return []
      }
      const files = (await res.json()) as Array<{ name: string }>
      return files
        .filter((f) => f.name.endsWith(".mdx"))
        .map((f) => f.name.replace(/\.mdx$/, ""))
    } catch (e) {
      console.error("GitHub API fetch failed:", e)
      return []
    }
  }

  async getPost(locale: Locale, slug: string): Promise<Post | null> {
    const url = this.rawUrl(`${this.contentPath}/posts/${locale}/${slug}.mdx`)
    try {
      const res = await fetch(url, {
        next: { revalidate: 3600 },
      } as RequestInit)
      if (!res.ok) {
        console.error(`GitHub raw fetch error: ${res.status} for ${url}`)
        return null
      }
      const raw = await res.text()
      const { frontmatter, content } = parseFrontmatter(raw)
      return { content, frontmatter, locale, slug }
    } catch (e) {
      console.error("GitHub raw fetch failed:", e)
      return null
    }
  }
}
