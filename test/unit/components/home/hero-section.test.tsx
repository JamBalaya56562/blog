import { afterEach, describe, expect, mock, test } from "bun:test"
import { cleanup, render } from "@testing-library/react"
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

const { HeroSection } = await import("@/components/home/hero-section")

afterEach(cleanup)

const COMMON = {
  postCount: 12,
  tagCount: 5,
  latestDate: "2026-04-01",
} as const

describe("HeroSection", () => {
  test("renders title from dictionary", () => {
    const dictionary = getDictionary("en")
    const { container } = render(
      <HeroSection locale="en" dictionary={dictionary} {...COMMON} />,
    )
    expect(container.textContent).toContain(dictionary.home.title)
    expect(container.textContent).toContain(dictionary.home.titleAccent)
  })

  test("renders subtitle from dictionary", () => {
    const dictionary = getDictionary("en")
    const { container } = render(
      <HeroSection locale="en" dictionary={dictionary} {...COMMON} />,
    )
    expect(container.textContent).toContain(dictionary.home.subtitle)
  })

  test("renders CTA button with correct text and link", () => {
    const dictionary = getDictionary("en")
    const { container } = render(
      <HeroSection locale="en" dictionary={dictionary} {...COMMON} />,
    )
    const links = container.querySelectorAll("a")
    const browseLink = Array.from(links).find((a) =>
      a.textContent?.includes(dictionary.home.ctaBrowse),
    )
    expect(browseLink).toBeDefined()
    expect(browseLink?.getAttribute("href")).toBe("/en/blog")
  })

  test("renders HUD strip with real blog metrics", () => {
    const dictionary = getDictionary("en")
    const { container } = render(
      <HeroSection
        locale="en"
        dictionary={dictionary}
        postCount={3}
        tagCount={2}
        latestDate="2026-04-01"
      />,
    )
    // Blog-relevant HUD labels (uppercase mono, hardcoded)
    expect(container.textContent).toContain("POSTS")
    expect(container.textContent).toContain("TAGS")
    expect(container.textContent).toContain("LATEST")
    // Latest date is dot-separated
    expect(container.textContent).toContain("2026.04.01")
    // Page-level NODE/DISPATCH/CASE_NO/TOTAL READ ticks were removed.
    expect(container.textContent).not.toContain("NODE.00")
    expect(container.textContent).not.toContain("DISPATCH_FEED")
    expect(container.textContent).not.toContain("CASE_NO")
    expect(container.textContent).not.toContain("TOTAL READ")
  })

  test("works with ja dictionary", () => {
    const dictionary = getDictionary("ja")
    const { container } = render(
      <HeroSection locale="ja" dictionary={dictionary} {...COMMON} />,
    )
    expect(container.textContent).toContain(dictionary.home.titleAccent)
    expect(container.textContent).toContain(dictionary.home.subtitle)

    const links = container.querySelectorAll("a")
    const browseLink = Array.from(links).find((a) =>
      a.textContent?.includes(dictionary.home.ctaBrowse),
    )
    expect(browseLink?.getAttribute("href")).toBe("/ja/blog")
  })
})
