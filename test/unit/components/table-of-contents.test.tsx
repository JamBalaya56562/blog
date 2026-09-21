import { describe, expect, test } from "bun:test"
import { act, fireEvent, render } from "@testing-library/react"
import type { TocItem } from "@/lib/toc"

const { TableOfContents } = await import("@/components/table-of-contents")

const items: TocItem[] = [
  { id: "intro", level: 2, text: "Introduction" },
  { id: "details", level: 3, text: "Details" },
  { id: "conclusion", level: 2, text: "Conclusion" },
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
    const track = container.firstElementChild
    // The panel needs the horizontal room around the centred article column,
    // so the track that carries it appears from `xl`.
    expect(track?.className).toContain("hidden")
    expect(track?.className).toContain("xl:block")
  })

  test("the panel is placed and ended by the post's column", () => {
    const { container } = render(<TableOfContents items={items} title="TOC" />)
    const track = container.firstElementChild
    const nav = container.querySelector("nav")
    // `left-full` on the column puts the panel's left edge on the column's
    // right edge without measuring the viewport, and `inset-y-0` with a
    // `sticky` panel is what takes the panel away at the column's end rather
    // than leaving it over the gap above the footer.
    expect(track?.className).toContain("left-full")
    expect(track?.className).toContain("inset-y-0")
    expect(nav?.className).toContain("sticky")
    // The list is still the part that scrolls, so the panel is a flex column.
    expect(nav?.className).toContain("flex-col")
  })

  test("renders the provided title", () => {
    const { container } = render(<TableOfContents items={items} title="目次" />)
    const heading = container.querySelector("p")
    expect(heading?.textContent).toBe("目次")
  })
})

describe("TableOfContents scrollbar", () => {
  // The list keeps a thin gutter for its scrollbar and colours the bar in
  // only while moving: `data-scrolling` goes on with the first scroll event
  // and off 700ms after the last one, and the stylesheet keys
  // `scrollbar-color` off it.
  test("the list is marked scrolling only briefly after a scroll", async () => {
    const { container } = render(<TableOfContents items={items} title="TOC" />)
    const list = container.querySelector("ul")
    if (!list) {
      throw new Error("no list rendered")
    }
    expect(list.dataset.scrolling).toBeUndefined()

    fireEvent.scroll(list)
    expect(list.dataset.scrolling).toBe("true")

    await act(() => new Promise((resolve) => setTimeout(resolve, 750)))
    expect(list.dataset.scrolling).toBeUndefined()
  })

  test("the list is the scroll container, capped by the panel", () => {
    const { container } = render(<TableOfContents items={items} title="TOC" />)
    const nav = container.querySelector("nav")
    const list = container.querySelector("ul")
    expect(nav?.className).toContain("max-h-[calc(100vh-10rem)]")
    expect(list?.className).toContain("overflow-y-auto")
    expect(list?.className).toContain("pp-toc-list")
  })
})
