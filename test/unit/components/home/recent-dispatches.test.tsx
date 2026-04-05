import { afterEach, describe, expect, mock, test } from "bun:test"
import { cleanup, render } from "@testing-library/react"
import type { Post } from "@/lib/content/types"
import { getDictionary } from "@/lib/i18n/get-dictionary"

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

const { RecentDispatches } = await import("@/components/home/recent-dispatches")

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
    content: "",
    ...overrides,
  }
}

describe("RecentDispatches", () => {
  const dictionary = getDictionary("en")

  test("renders section title and description from dictionary", () => {
    const posts = [createMockPost()]
    const { container } = render(
      <RecentDispatches locale="en" dictionary={dictionary} posts={posts} />,
    )
    expect(container.textContent).toContain(dictionary.home.recentTitle)
    expect(container.textContent).toContain(dictionary.home.recentDescription)
  })

  test("renders post entries with numbered index, title, date, tag", () => {
    const posts = [
      createMockPost({
        slug: "post-1",
        frontmatter: {
          title: "First",
          date: "2024-03-15",
          description: "d",
          tags: ["react"],
        },
      }),
      createMockPost({
        slug: "post-2",
        frontmatter: {
          title: "Second",
          date: "2024-03-16",
          description: "d",
          tags: ["next"],
        },
      }),
    ]
    const { container } = render(
      <RecentDispatches locale="en" dictionary={dictionary} posts={posts} />,
    )
    expect(container.textContent).toContain("01")
    expect(container.textContent).toContain("02")
    expect(container.textContent).toContain("First")
    expect(container.textContent).toContain("Second")
    expect(container.textContent).toContain("2024-03-15")
    expect(container.textContent).toContain("react")
    expect(container.textContent).toContain("next")
  })

  test("renders View all link to /{locale}/blog", () => {
    const posts = [createMockPost()]
    const { container } = render(
      <RecentDispatches locale="en" dictionary={dictionary} posts={posts} />,
    )
    const links = container.querySelectorAll("a")
    const viewAllLink = Array.from(links).find((a) =>
      a.textContent?.includes(dictionary.home.viewAll),
    )
    expect(viewAllLink).toBeDefined()
    expect(viewAllLink?.getAttribute("href")).toBe("/en/blog")
  })

  test("returns null when posts array is empty", () => {
    const { container } = render(
      <RecentDispatches locale="en" dictionary={dictionary} posts={[]} />,
    )
    expect(container.innerHTML).toBe("")
  })

  test("shows Read Dispatch text in DOM", () => {
    const posts = [createMockPost()]
    const { container } = render(
      <RecentDispatches locale="en" dictionary={dictionary} posts={posts} />,
    )
    expect(container.textContent).toContain(dictionary.home.readDispatch)
  })

  test("works with ja dictionary", () => {
    const jaDictionary = getDictionary("ja")
    const posts = [createMockPost({ slug: "ja-post", locale: "ja" })]
    const { container } = render(
      <RecentDispatches locale="ja" dictionary={jaDictionary} posts={posts} />,
    )
    expect(container.textContent).toContain(jaDictionary.home.recentTitle)
    expect(container.textContent).toContain(jaDictionary.home.viewAll)

    const links = container.querySelectorAll("a")
    const viewAllLink = Array.from(links).find((a) =>
      a.textContent?.includes(jaDictionary.home.viewAll),
    )
    expect(viewAllLink?.getAttribute("href")).toBe("/ja/blog")
  })
})
