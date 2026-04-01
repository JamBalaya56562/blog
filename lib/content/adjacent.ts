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
 * 記事リストから指定slugの前後記事を取得する純粋関数。
 * 内部で日付降順にソートするため、入力の並び順に依存しない。
 */
export function findAdjacentPosts(
  posts: Post[],
  currentSlug: string,
): AdjacentPosts {
  const nullResult: AdjacentPosts = { previous: null, next: null }

  if (posts.length <= 1) {
    return nullResult
  }

  const sorted = [...posts].sort(
    (a, b) =>
      new Date(b.frontmatter.date).getTime() -
      new Date(a.frontmatter.date).getTime(),
  )

  const currentIndex = sorted.findIndex((post) => post.slug === currentSlug)

  if (currentIndex === -1) {
    return nullResult
  }

  const previous =
    currentIndex < sorted.length - 1
      ? {
          slug: sorted[currentIndex + 1].slug,
          title: sorted[currentIndex + 1].frontmatter.title,
        }
      : null

  const next =
    currentIndex > 0
      ? {
          slug: sorted[currentIndex - 1].slug,
          title: sorted[currentIndex - 1].frontmatter.title,
        }
      : null

  return { previous, next }
}
