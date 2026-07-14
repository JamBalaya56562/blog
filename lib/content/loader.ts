import type { Locale } from "@/lib/i18n/config"
import type { Post } from "./types"

export interface ContentLoader {
  getPostSlugs(locale: Locale): Promise<string[]>
  getPost(locale: Locale, slug: string): Promise<Post | null>
  getAllPosts(locale: Locale): Promise<Post[]>
}

export function createContentLoader(): ContentLoader {
  const source = process.env.CONTENT_SOURCE ?? "local"
  // During `next build`, always read content from the local filesystem.
  // The content lives in the repo (copied into the builder image), so the
  // build never depends on the GitHub API — which is unauthenticated here
  // and rate-limited to 60 req/h, causing 403s that make generateStaticParams
  // return empty and fail the build under Cache Components. At runtime the
  // configured source (e.g. "github") is still used for revalidation.
  const isBuild = process.env.NEXT_PHASE === "phase-production-build"
  if (source === "github" && !isBuild) {
    const { GitHubContentLoader } = require("./github-loader")
    return new GitHubContentLoader()
  }
  const { LocalContentLoader } = require("./local-loader")
  return new LocalContentLoader()
}
