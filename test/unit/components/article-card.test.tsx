import { describe, expect, mock, test } from "bun:test"
import { render } from "@testing-library/react"

mock.module("next/image", () => ({
  default: ({
    src,
    alt,
    className,
    ...props
  }: {
    src: string
    alt: string
    className?: string
  } & Record<string, unknown>) => (
    <img src={src} alt={alt} className={className} {...props} />
  ),
}))

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

mock.module("@/components/home/tag-link", () => ({
  TagLink: ({ tag }: { tag: string }) => <span>{tag}</span>,
}))

mock.module("@/lib/routes", () => ({
  getBlogPostPath: (locale: string, slug: string) => `/${locale}/blog/${slug}`,
}))

const { ArticleCard } = await import("@/components/article-card")

const basePost = {
  slug: "test-post",
  locale: "en" as const,
  frontmatter: {
    title: "Test Article Title",
    date: "2025-01-15",
    description: "This is a test description for the article card.",
    tags: ["react", "nextjs"],
    image: "https://example.com/image.png",
  },
  content: "Some content here for reading time estimation.",
}

describe("ArticleCard rendering", () => {
  // Validates: Requirements 1.3
  test("description text is displayed with line-clamp-2 class", () => {
    const { container } = render(<ArticleCard post={basePost} locale="en" />)
    const desc = container.querySelector("p")
    expect(desc).not.toBeNull()
    expect(desc?.textContent).toBe(basePost.frontmatter.description)
    expect(desc?.className).toContain("line-clamp-2")
  })

  // Validates: Requirements 2.3
  test("image has aspect-video class applied", () => {
    const { container } = render(<ArticleCard post={basePost} locale="en" />)
    const img = container.querySelector("img")
    expect(img).not.toBeNull()
    expect(img?.className).toContain("aspect-video")
  })

  // Validates: Requirements 1.5, 6.4
  test("image alt attribute matches post title", () => {
    const { container } = render(<ArticleCard post={basePost} locale="en" />)
    const img = container.querySelector("img")
    expect(img).not.toBeNull()
    expect(img?.getAttribute("alt")).toBe(basePost.frontmatter.title)
  })

  // Validates: Requirements 1.3
  test("description paragraph is not rendered when description is empty", () => {
    const postWithoutDesc = {
      ...basePost,
      frontmatter: { ...basePost.frontmatter, description: "" },
    }
    const { container } = render(
      <ArticleCard post={postWithoutDesc} locale="en" />,
    )
    const paragraphs = container.querySelectorAll("p")
    const descParagraph = Array.from(paragraphs).find((p) =>
      p.className.includes("line-clamp-2"),
    )
    expect(descParagraph).toBeUndefined()
  })
})
