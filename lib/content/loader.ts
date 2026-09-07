import type { Locale } from "@/lib/i18n/config"
import { GitHubContentLoader } from "./github-loader"
import { LocalContentLoader } from "./local-loader"
import type { Post } from "./types"

export interface ContentLoader {
  getPostSlugs(locale: Locale): Promise<string[]>
  getPost(locale: Locale, slug: string): Promise<Post | null>
  getAllPosts(locale: Locale): Promise<Post[]>
}

export function createContentLoader(): ContentLoader {
  const source = process.env.CONTENT_SOURCE ?? "local"
  const isBuild = process.env.NEXT_PHASE === "phase-production-build"
  if (source === "github" && !isBuild) {
    return new GitHubContentLoader()
  }
  return new LocalContentLoader()
}
