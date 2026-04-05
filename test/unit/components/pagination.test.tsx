import { describe, expect, mock, test } from "bun:test"
import { render } from "@testing-library/react"

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

const { Pagination } = await import("@/components/pagination")

const defaultLabels = {
  previous: "Previous",
  next: "Next",
  pagination: "Pagination",
}

describe("Pagination", () => {
  // Validates: Requirements 3.2
  test("returns null when totalPages <= 1", () => {
    const { container } = render(
      <Pagination
        currentPage={1}
        totalPages={1}
        basePath="/en/blog"
        labels={defaultLabels}
      />,
    )
    expect(container.innerHTML).toBe("")
  })

  // Validates: Requirements 6.2
  test("renders nav element with correct aria-label", () => {
    const { container } = render(
      <Pagination
        currentPage={1}
        totalPages={3}
        basePath="/en/blog"
        labels={defaultLabels}
      />,
    )
    const nav = container.querySelector("nav")
    expect(nav).not.toBeNull()
    expect(nav?.getAttribute("aria-label")).toBe("Pagination")
  })

  // Validates: Requirements 3.7
  test("current page has aria-current='page'", () => {
    const { container } = render(
      <Pagination
        currentPage={2}
        totalPages={3}
        basePath="/en/blog"
        labels={defaultLabels}
      />,
    )
    const current = container.querySelector("[aria-current='page']")
    expect(current).not.toBeNull()
    expect(current?.textContent).toBe("2")
  })

  // Validates: Requirements 3.5
  test("previous button is disabled on first page", () => {
    const { container } = render(
      <Pagination
        currentPage={1}
        totalPages={3}
        basePath="/en/blog"
        labels={defaultLabels}
      />,
    )
    const disabled = container.querySelector("[aria-disabled='true']")
    expect(disabled).not.toBeNull()
    expect(disabled?.textContent).toBe("Previous")
  })

  // Validates: Requirements 3.6
  test("next button is disabled on last page", () => {
    const { container } = render(
      <Pagination
        currentPage={3}
        totalPages={3}
        basePath="/en/blog"
        labels={defaultLabels}
      />,
    )
    const disabledElements = container.querySelectorAll(
      "[aria-disabled='true']",
    )
    const nextDisabled = Array.from(disabledElements).find(
      (el) => el.textContent === "Next",
    )
    expect(nextDisabled).not.toBeUndefined()
  })

  // Validates: Requirements 3.3, 3.5
  test("previous button is a link on non-first pages", () => {
    const { container } = render(
      <Pagination
        currentPage={2}
        totalPages={3}
        basePath="/en/blog"
        labels={defaultLabels}
      />,
    )
    const links = container.querySelectorAll("a")
    const prevLink = Array.from(links).find(
      (el) => el.textContent === "Previous",
    )
    expect(prevLink).not.toBeUndefined()
    expect(prevLink?.getAttribute("href")).toBe("/en/blog")
  })

  // Validates: Requirements 3.3, 3.6
  test("next button is a link on non-last pages", () => {
    const { container } = render(
      <Pagination
        currentPage={1}
        totalPages={3}
        basePath="/en/blog"
        labels={defaultLabels}
      />,
    )
    const links = container.querySelectorAll("a")
    const nextLink = Array.from(links).find((el) => el.textContent === "Next")
    expect(nextLink).not.toBeUndefined()
    expect(nextLink?.getAttribute("href")).toBe("/en/blog?page=2")
  })
})
