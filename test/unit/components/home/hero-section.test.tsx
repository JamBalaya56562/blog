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

describe("HeroSection", () => {
  test("renders badge text from dictionary", () => {
    const dictionary = getDictionary("en")
    const { container } = render(
      <HeroSection locale="en" dictionary={dictionary} />,
    )
    expect(container.textContent).toContain(dictionary.home.badge)
  })

  test("renders title and titleAccent from dictionary", () => {
    const dictionary = getDictionary("en")
    const { container } = render(
      <HeroSection locale="en" dictionary={dictionary} />,
    )
    expect(container.textContent).toContain(dictionary.home.title)
    expect(container.textContent).toContain(dictionary.home.titleAccent)
  })

  test("renders subtitle from dictionary", () => {
    const dictionary = getDictionary("en")
    const { container } = render(
      <HeroSection locale="en" dictionary={dictionary} />,
    )
    expect(container.textContent).toContain(dictionary.home.subtitle)
  })

  test("renders CTA button with correct text and link", () => {
    const dictionary = getDictionary("en")
    const { container } = render(
      <HeroSection locale="en" dictionary={dictionary} />,
    )
    const links = container.querySelectorAll("a")
    const browseLink = Array.from(links).find(
      (a) => a.textContent === dictionary.home.ctaBrowse,
    )
    expect(browseLink).toBeDefined()
    expect(browseLink?.getAttribute("href")).toBe("/en/blog")
  })

  test("works with ja dictionary", () => {
    const dictionary = getDictionary("ja")
    const { container } = render(
      <HeroSection locale="ja" dictionary={dictionary} />,
    )
    expect(container.textContent).toContain(dictionary.home.badge)
    expect(container.textContent).toContain(dictionary.home.titleAccent)
    expect(container.textContent).toContain(dictionary.home.subtitle)

    const links = container.querySelectorAll("a")
    const browseLink = Array.from(links).find(
      (a) => a.textContent === dictionary.home.ctaBrowse,
    )
    expect(browseLink?.getAttribute("href")).toBe("/ja/blog")
  })
})
