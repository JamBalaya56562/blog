import type { Post } from "./types"

export interface AdjacentPost {
  slug: string
  title: string
}

export interface AdjacentPosts {
  previous: AdjacentPost | null
  next: AdjacentPost | null
}

/**
 * ソート済み記事リストから指定slugの前後記事を取得する純粋関数。
 * posts は日付降順でソート済みであること。
 */
export function findAdjacentPosts(
  posts: Post[],
  currentSlug: string,
): AdjacentPosts {
  const nullResult: AdjacentPosts = { previous: null, next: null }

  if (posts.length <= 1) {
    return nullResult
  }

  const currentIndex = posts.findIndex((post) => post.slug === currentSlug)

  if (currentIndex === -1) {
    return nullResult
  }

  const previous =
    currentIndex < posts.length - 1
      ? {
          slug: posts[currentIndex + 1].slug,
          title: posts[currentIndex + 1].frontmatter.title,
        }
      : null

  const next =
    currentIndex > 0
      ? {
          slug: posts[currentIndex - 1].slug,
          title: posts[currentIndex - 1].frontmatter.title,
        }
      : null

  return { previous, next }
}
