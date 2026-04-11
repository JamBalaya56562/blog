import type { Post } from "./types"

export function sortPostsByDate(posts: Post[]): Post[] {
  return [...posts].sort((a, b) =>
    b.frontmatter.date.localeCompare(a.frontmatter.date),
  )
}

export function filterPostsByTag(posts: Post[], tag: string): Post[] {
  return posts.filter((p) => p.frontmatter.tags.includes(tag))
}

export function filterPostsByKeyword(posts: Post[], keyword: string): Post[] {
  const trimmed = keyword.trim()
  if (!trimmed) {
    return posts
  }
  const normalized = trimmed.toLowerCase()
  return posts.filter((post) => {
    const { title, description, tags } = post.frontmatter
    return (
      title.toLowerCase().includes(normalized) ||
      description.toLowerCase().includes(normalized) ||
      post.content.toLowerCase().includes(normalized) ||
      tags.some((tag) => tag.toLowerCase().includes(normalized))
    )
  })
}
