import { afterEach, describe, expect, test } from "bun:test"
import { cleanup, fireEvent, render } from "@testing-library/react"
import { CodeTabs } from "@/components/code-tabs"

afterEach(cleanup)

const twoTabs = (
  <CodeTabs labels={["macOS / Linux", "Windows"]}>
    <pre>curl -fsSL https://mise.run | sh</pre>
    <pre>winget install jdx.mise</pre>
  </CodeTabs>
)

describe("CodeTabs", () => {
  test("shows the first panel and hides the rest", () => {
    const { getAllByRole } = render(twoTabs)

    const panels = getAllByRole("tabpanel", { hidden: true })
    expect(panels).toHaveLength(2)
    expect(panels[0].hidden).toBe(false)
    expect(panels[1].hidden).toBe(true)
  })

  /**
   * Hidden rather than unmounted: the other platform's instructions have to be
   * in the served markup for search engines, and for a reader who arrives
   * before hydration.
   */
  test("keeps every panel in the markup", () => {
    const { container } = render(twoTabs)

    expect(container.textContent).toContain("curl -fsSL")
    expect(container.textContent).toContain("winget install")
  })

  test("clicking a tab reveals its panel", () => {
    const { getAllByRole, getByRole } = render(twoTabs)

    fireEvent.click(getByRole("tab", { name: "Windows" }))

    const panels = getAllByRole("tabpanel", { hidden: true })
    expect(panels[0].hidden).toBe(true)
    expect(panels[1].hidden).toBe(false)
    expect(
      getByRole("tab", { name: "Windows" }).getAttribute("aria-selected"),
    ).toBe("true")
  })

  /**
   * With a roving tabindex the unselected tabs are not tab stops, so an arrow
   * key that moved the selection without moving the focus would leave the
   * keyboard user on an element they can no longer see the state of.
   */
  test("arrow keys move the selection and the focus, wrapping at the ends", () => {
    const { getByRole } = render(twoTabs)
    const first = getByRole("tab", { name: "macOS / Linux" })
    const second = getByRole("tab", { name: "Windows" })

    first.focus()
    fireEvent.keyDown(first, { key: "ArrowRight" })
    expect(document.activeElement).toBe(second)
    expect(second.tabIndex).toBe(0)
    expect(first.tabIndex).toBe(-1)

    // One more wraps back around rather than stopping at the end.
    fireEvent.keyDown(second, { key: "ArrowRight" })
    expect(document.activeElement).toBe(first)

    fireEvent.keyDown(first, { key: "ArrowLeft" })
    expect(document.activeElement).toBe(second)
  })

  test("ignores keys that are not arrows", () => {
    const { getByRole } = render(twoTabs)
    const first = getByRole("tab", { name: "macOS / Linux" })

    fireEvent.keyDown(first, { key: "a" })

    expect(
      getByRole("tab", { name: "macOS / Linux" }).getAttribute("aria-selected"),
    ).toBe("true")
  })

  test("each tab points at the panel it controls", () => {
    const { getAllByRole } = render(twoTabs)

    const tabs = getAllByRole("tab")
    const panels = getAllByRole("tabpanel", { hidden: true })
    tabs.forEach((tab, index) => {
      expect(tab.getAttribute("aria-controls")).toBe(panels[index].id)
      expect(panels[index].getAttribute("aria-labelledby")).toBe(tab.id)
    })
  })

  /**
   * Panels are matched to labels by position, so a miscount would silently
   * label a block with its neighbour's platform — worse than failing to build.
   */
  test("refuses a label count that does not match the blocks", () => {
    expect(() =>
      render(
        <CodeTabs labels={["macOS / Linux", "Windows"]}>
          <pre>only one block</pre>
        </CodeTabs>,
      ),
    ).toThrow("2 labels but 1 code blocks")
  })
})
