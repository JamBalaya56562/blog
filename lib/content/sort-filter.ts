import type { Post } from "./types"

export function sortPostsByDate(posts: Post[]): Post[] {
  return [...posts].sort((a, b) =>
    b.frontmatter.date.localeCompare(a.frontmatter.date),
  )
}

export function filterPostsByTag(posts: Post[], tag: string): Post[] {
  return posts.filter((p) => p.frontmatter.tags.includes(tag))
}
