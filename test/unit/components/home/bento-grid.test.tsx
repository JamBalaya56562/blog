import { afterEach, describe, expect, mock, test } from "bun:test"
import { cleanup, render } from "@testing-library/react"
import type { Post } from "@/lib/content/types"

mock.module("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: { href: string; children: React.ReactNode } & Record<string, unknown>) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

mock.module("next/image", () => ({
  default: ({
    alt = "",
    ...props
  }: { alt?: string } & Record<string, unknown>) => (
    <img alt={alt} {...props} />
  ),
}))

const { BentoGrid } = await import("@/components/home/bento-grid")

afterEach(cleanup)

function createMockPost(overrides: Partial<Post> = {}): Post {
  return {
    slug: "test-post",
    locale: "en",
    frontmatter: {
      title: "Test Post",
      date: "2024-01-01",
      description: "Test description",
      tags: ["typescript"],
    },
    content: "Some content for reading time estimation.",
    ...overrides,
  }
}

describe("BentoGrid", () => {
  test("renders 3 posts with tags and reading time", () => {
    const posts = [
      createMockPost({
        slug: "post-1",
        frontmatter: {
          title: "First Post",
          date: "2024-01-01",
          description: "Desc 1",
          tags: ["react"],
        },
      }),
      createMockPost({
        slug: "post-2",
        frontmatter: {
          title: "Second Post",
          date: "2024-01-02",
          description: "Desc 2",
          tags: ["next"],
        },
      }),
      createMockPost({
        slug: "post-3",
        frontmatter: {
          title: "Third Post",
          date: "2024-01-03",
          description: "Desc 3",
          tags: ["bun"],
        },
      }),
    ]
    const { container } = render(<BentoGrid locale="en" posts={posts} />)
    expect(container.textContent).toContain("First Post")
    expect(container.textContent).toContain("Second Post")
    expect(container.textContent).toContain("Third Post")
    expect(container.textContent).toContain("react")
    expect(container.textContent).toContain("min read")
  })

  test("returns null when posts array is empty", () => {
    const { container } = render(<BentoGrid locale="en" posts={[]} />)
    expect(container.innerHTML).toBe("")
  })

  test("renders 1 post as full-width card", () => {
    const posts = [createMockPost({ slug: "solo" })]
    const { container } = render(<BentoGrid locale="en" posts={posts} />)
    expect(container.textContent).toContain("Test Post")
    const grid = container.querySelector(".grid")
    expect(grid?.className).toContain("grid-cols-1")
    expect(grid?.className).not.toContain("md:grid-cols-3")
  })

  test("renders 2 posts in 2-column layout", () => {
    const posts = [
      createMockPost({
        slug: "post-a",
        frontmatter: {
          title: "Post A",
          date: "2024-01-01",
          description: "A",
          tags: ["ts"],
        },
      }),
      createMockPost({
        slug: "post-b",
        frontmatter: {
          title: "Post B",
          date: "2024-01-02",
          description: "B",
          tags: ["js"],
        },
      }),
    ]
    const { container } = render(<BentoGrid locale="en" posts={posts} />)
    expect(container.textContent).toContain("Post A")
    expect(container.textContent).toContain("Post B")
    const grid = container.querySelector(".grid")
    expect(grid?.className).toContain("md:grid-cols-2")
  })

  test("each card links to correct blog post path", () => {
    const posts = [
      createMockPost({
        slug: "alpha",
        frontmatter: {
          title: "Alpha",
          date: "2024-01-01",
          description: "A",
          tags: ["ts"],
        },
      }),
      createMockPost({
        slug: "beta",
        frontmatter: {
          title: "Beta",
          date: "2024-01-02",
          description: "B",
          tags: ["js"],
        },
      }),
    ]
    const { container } = render(<BentoGrid locale="en" posts={posts} />)
    const links = container.querySelectorAll("a")
    expect(links[0]?.getAttribute("href")).toBe("/en/blog/alpha")
    expect(links[1]?.getAttribute("href")).toBe("/en/blog/beta")
  })
})
