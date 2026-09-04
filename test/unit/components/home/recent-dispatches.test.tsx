import { afterEach, describe, expect, mock, test } from "bun:test"
import { cleanup, render } from "@testing-library/react"
import type { Post } from "@/lib/content/types"
import { getDictionary } from "@/lib/i18n/get-dictionary"

// The real `next/link` consumes `transitionTypes` and never forwards it to
// the DOM. Mirror that here — spreading it onto an `<a>` would warn about an
// unknown prop — and surface it as a data attribute so tests can assert the
// navigation direction a link carries.
mock.module("next/link", () => ({
  default: ({
    href,
    children,
    transitionTypes,
    ...props
  }: {
    href: string
    children: React.ReactNode
    transitionTypes?: string[]
  } & Record<string, unknown>) => (
    <a
      href={href}
      data-transition-types={transitionTypes?.join(" ")}
      {...props}
    >
      {children}
    </a>
  ),
}))

const { RecentDispatches } = await import("@/components/home/recent-dispatches")

afterEach(cleanup)

function createMockPost(overrides: Partial<Post> = {}): Post {
  return {
    content: "",
    frontmatter: {
      date: "2024-01-01",
      description: "Test description",
      tags: ["typescript"],
      title: "Test Post",
    },
    locale: "en",
    slug: "test-post",
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

  test("renders post entries with numbered index, title, dotted date, tag", () => {
    const posts = [
      createMockPost({
        frontmatter: {
          date: "2024-03-15",
          description: "d",
          tags: ["react"],
          title: "First",
        },
        slug: "post-1",
      }),
      createMockPost({
        frontmatter: {
          date: "2024-03-16",
          description: "d",
          tags: ["next"],
          title: "Second",
        },
        slug: "post-2",
      }),
    ]
    const { container } = render(
      <RecentDispatches locale="en" dictionary={dictionary} posts={posts} />,
    )
    expect(container.textContent).toContain("001")
    expect(container.textContent).toContain("002")
    expect(container.textContent).toContain("First")
    expect(container.textContent).toContain("Second")
    // dates are rendered with dot separators in the cyber design
    expect(container.textContent).toContain("2024.03.15")
    expect(container.textContent).toContain("react")
    expect(container.textContent).toContain("next")
  })

  test("indexOffset shifts the numbering", () => {
    const posts = [createMockPost({ slug: "p" })]
    const { container } = render(
      <RecentDispatches
        locale="en"
        dictionary={dictionary}
        posts={posts}
        indexOffset={5}
      />,
    )
    expect(container.textContent).toContain("006")
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

  test("every link navigates forward", () => {
    const posts = [createMockPost()]
    const { container } = render(
      <RecentDispatches locale="en" dictionary={dictionary} posts={posts} />,
    )
    const directions = Array.from(container.querySelectorAll("a")).map((a) =>
      a.getAttribute("data-transition-types"),
    )
    expect(directions.length).toBeGreaterThan(0)
    expect(directions.every((d) => d === "nav-forward")).toBe(true)
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
    const posts = [createMockPost({ locale: "ja", slug: "ja-post" })]
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
