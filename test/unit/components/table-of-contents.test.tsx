import { describe, expect, test } from "bun:test"
import { render } from "@testing-library/react"
import type { TocItem } from "@/lib/toc"

const { TableOfContents } = await import("@/components/table-of-contents")

const items: TocItem[] = [
  { id: "intro", text: "Introduction", level: 2 },
  { id: "details", text: "Details", level: 3 },
  { id: "conclusion", text: "Conclusion", level: 2 },
]

describe("TableOfContents", () => {
  test("renders nothing when items is empty", () => {
    const { container } = render(<TableOfContents items={[]} title="TOC" />)
    expect(container.innerHTML).toBe("")
  })

  test("renders all toc items as links", () => {
    const { container } = render(<TableOfContents items={items} title="TOC" />)
    const links = container.querySelectorAll("a")
    expect(links.length).toBe(3)
    expect(links[0].textContent).toBe("Introduction")
    expect(links[0].getAttribute("href")).toBe("#intro")
    expect(links[2].textContent).toBe("Conclusion")
  })

  test("h3 items are indented", () => {
    const { container } = render(<TableOfContents items={items} title="TOC" />)
    const listItems = container.querySelectorAll("li")
    expect(listItems[0].style.paddingLeft).toBe("0.75rem")
    expect(listItems[1].style.paddingLeft).toBe("1.5rem")
  })

  test("has hidden class for non-xl screens", () => {
    const { container } = render(<TableOfContents items={items} title="TOC" />)
    const nav = container.querySelector("nav")
    expect(nav?.className).toContain("hidden")
    expect(nav?.className).toContain("lg:block")
  })

  test("renders the provided title", () => {
    const { container } = render(<TableOfContents items={items} title="目次" />)
    const heading = container.querySelector("p")
    expect(heading?.textContent).toBe("目次")
  })
})
