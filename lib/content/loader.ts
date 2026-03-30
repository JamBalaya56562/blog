import type { Locale } from "@/lib/i18n/config"
import type { Post } from "./types"

export interface ContentLoader {
  getPostSlugs(locale: Locale): Promise<string[]>
  getPost(locale: Locale, slug: string): Promise<Post | null>
  getAllPosts(locale: Locale): Promise<Post[]>
}

export function createContentLoader(): ContentLoader {
  const source = process.env.CONTENT_SOURCE ?? "local"
  if (source === "github") {
    const { GitHubContentLoader } = require("./github-loader")
    return new GitHubContentLoader()
  }
  const { LocalContentLoader } = require("./local-loader")
  return new LocalContentLoader()
}
