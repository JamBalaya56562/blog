import { afterEach, describe, expect, test } from "bun:test"
import { act, cleanup, fireEvent, render } from "@testing-library/react"
import { MobileIndex } from "@/components/mobile-index"
import { TableOfContents } from "@/components/table-of-contents"
import { TocProvider } from "@/components/toc-context"
import { getDictionary } from "@/lib/i18n/get-dictionary"
import type { TocItem } from "@/lib/toc"

afterEach(cleanup)

const dictionary = getDictionary("en")

const items: TocItem[] = [
  { id: "intro", level: 2, text: "Introduction" },
  { id: "details", level: 3, text: "Details" },
]

// The header renders the button; the post renders the panel that publishes
// the index. Both under one provider is the layout's arrangement.
function renderPage(withPost: boolean) {
  return render(
    <TocProvider>
      <MobileIndex dictionary={dictionary} />
      {withPost && <TableOfContents items={items} title="A post" />}
    </TocProvider>,
  )
}

describe("MobileIndex", () => {
  test("renders nothing when no post has published an index", () => {
    const { queryByTestId } = renderPage(false)
    expect(queryByTestId("mobile-index-button")).toBeNull()
  })

  test("appears once a post publishes its index, and opens the same list", () => {
    const { getByTestId, container, getByLabelText } = renderPage(true)
    const button = getByTestId("mobile-index-button")
    expect(button.getAttribute("aria-label")).toBe(dictionary.nav.openIndex)
    expect(button.getAttribute("aria-expanded")).toBe("false")

    act(() => {
      fireEvent.click(button)
    })
    expect(button.getAttribute("aria-expanded")).toBe("true")
    expect(button.getAttribute("aria-label")).toBe(dictionary.nav.closeIndex)

    const panel = getByLabelText("A post")
    const links = panel.querySelectorAll("a")
    expect(links).toHaveLength(2)
    expect(links[0].textContent).toBe("Introduction")
    // The desktop panel is still there for wide screens; the two lists are
    // the same component fed the same items.
    expect(container.querySelectorAll("ul.pp-toc-list")).toHaveLength(2)
  })

  test("the panel is gone once the post unmounts", () => {
    const { queryByTestId, rerender } = renderPage(true)
    expect(queryByTestId("mobile-index-button")).not.toBeNull()

    rerender(
      <TocProvider>
        <MobileIndex dictionary={dictionary} />
      </TocProvider>,
    )
    expect(queryByTestId("mobile-index-button")).toBeNull()
  })
})

describe("MobileIndex keyboard", () => {
  // Opening leaves focus on the button, so the panel itself never sees the
  // key; the listener is on the document while the panel is open.
  test("Escape closes the panel from wherever focus is", async () => {
    const { getByTestId, queryByLabelText } = renderPage(true)
    const button = getByTestId("mobile-index-button")
    act(() => {
      fireEvent.click(button)
    })
    expect(queryByLabelText("A post")).not.toBeNull()

    act(() => {
      fireEvent.keyDown(document, { key: "Escape" })
    })
    await act(() => new Promise((resolve) => setTimeout(resolve, 300)))
    expect(queryByLabelText("A post")).toBeNull()
    expect(button.getAttribute("aria-expanded")).toBe("false")
  })
})
