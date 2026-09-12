import { afterEach, describe, expect, test } from "bun:test"
import { act, cleanup, fireEvent, render } from "@testing-library/react"
import { MobileMenu } from "@/components/mobile-menu"
import { getDictionary } from "@/lib/i18n/get-dictionary"

afterEach(cleanup)

const dictionary = getDictionary("en")

function renderMenu() {
  return render(
    <MobileMenu dictionary={dictionary}>
      <a href="/en/blog" className="pp-mi">
        Blog
      </a>
      <a href="/en/portfolio" className="pp-mi">
        Portfolio
      </a>
    </MobileMenu>,
  )
}

describe("MobileMenu", () => {
  test("opens on the button and marks the burger as open", () => {
    const { getByLabelText, queryByRole } = renderMenu()
    expect(queryByRole("menu")).toBeNull()

    const button = getByLabelText(dictionary.nav.openMenu)
    act(() => {
      fireEvent.click(button)
    })
    expect(queryByRole("menu")).not.toBeNull()
    expect(button.dataset.open).toBe("true")
    expect(button.getAttribute("aria-label")).toBe(dictionary.nav.closeMenu)
  })

  // Closing plays an exit animation before the panel leaves the tree, so the
  // menu is still there immediately after the click and gone 220ms later.
  test("closing keeps the panel mounted for the exit animation, then removes it", async () => {
    const { getByLabelText, queryByRole, container } = renderMenu()
    act(() => {
      fireEvent.click(getByLabelText(dictionary.nav.openMenu))
    })
    // Both the burger and the backdrop are labelled "close"; the burger is
    // the one that carries data-open.
    act(() => {
      fireEvent.click(container.querySelector(".pp-burger") as HTMLElement)
    })
    const panel = container.querySelector(".pp-mpanel")
    expect(panel?.getAttribute("data-closing")).toBe("true")
    expect(queryByRole("menu")).not.toBeNull()

    await act(() => new Promise((resolve) => setTimeout(resolve, 260)))
    expect(queryByRole("menu")).toBeNull()
  })

  test("Escape closes it from wherever focus is", async () => {
    const { getByLabelText, queryByRole } = renderMenu()
    act(() => {
      fireEvent.click(getByLabelText(dictionary.nav.openMenu))
    })
    act(() => {
      fireEvent.keyDown(window, { key: "Escape" })
    })
    await act(() => new Promise((resolve) => setTimeout(resolve, 260)))
    expect(queryByRole("menu")).toBeNull()
  })
})
