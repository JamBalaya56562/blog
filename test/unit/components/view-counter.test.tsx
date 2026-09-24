import { afterEach, describe, expect, mock, test } from "bun:test"
import { cleanup, render, waitFor } from "@testing-library/react"

// Mock the server action. It returns the count recorded by the write, which
// is what the counter shows once the effect resolves.
let actionResult: number | null = null
const incrementMock = mock(() => Promise.resolve(actionResult))
// What the page's read returns, for a counter rendered inside the provider.
let readResult: Record<string, number> = {}
// Both exports are stubbed even though this file only needs one: bun applies
// mock.module globally for the run, so a partial mock makes the missing export
// disappear for every other test file too.
mock.module("@/lib/actions/view-count", () => ({
  getViewCountsAction: mock(() => Promise.resolve(readResult)),
  incrementViewCountAction: incrementMock,
}))

afterEach(() => {
  cleanup()
  incrementMock.mockClear()
  actionResult = null
  readResult = {}
  // The counter records what it has counted, and the record outlives a render.
  try {
    localStorage.clear()
  } catch {}
})

const { ViewCounter } = await import("@/components/view-counter")
const { ViewCountsProvider } = await import("@/components/view-counts")

describe("ViewCounter", () => {
  test("renders view count immediately from prop", () => {
    const { container } = render(
      <ViewCounter slug="test-post" count={42} label="VIEWS" />,
    )
    expect(container.textContent).toContain("42")
    expect(container.textContent).toContain("VIEWS")
  })

  test("calls incrementViewCountAction on mount", async () => {
    render(<ViewCounter slug="my-slug" count={10} label="VIEWS" />)

    await waitFor(() => expect(incrementMock).toHaveBeenCalledTimes(1))
    expect(incrementMock).toHaveBeenCalledWith("my-slug")
  })

  test("formats large numbers with locale separators", () => {
    const { container } = render(
      <ViewCounter slug="popular" count={1234567} label="VIEWS" />,
    )
    expect(container.textContent).toContain("VIEWS")
    // toLocaleString() formats differently by locale, just check it's not raw digits
    expect(container.textContent).not.toContain("1234567")
  })

  test("renders 0 views when count is 0", () => {
    const { container } = render(
      <ViewCounter slug="new-post" count={0} label="VIEWS" />,
    )
    expect(container.textContent).toContain("0")
    expect(container.textContent).toContain("VIEWS")
  })

  // The pages that render this are `"use cache"` components and nothing
  // revalidates them, so the prop is always a stale figure. The count the
  // write returns is the only live one.
  test("replaces the server-rendered figure with the recorded count", async () => {
    actionResult = 43
    const { container } = render(
      <ViewCounter slug="test-post" count={42} label="VIEWS" />,
    )
    expect(container.textContent).toContain("42")

    await waitFor(() => expect(container.textContent).toContain("43"))
    expect(container.textContent).not.toContain("42")
  })

  test("keeps the rendered figure when the write reports nothing", async () => {
    // No database configured, or the write failed. Showing a zero here would
    // be worse than showing a stale number.
    actionResult = null
    const { container } = render(
      <ViewCounter slug="test-post" count={42} label="VIEWS" />,
    )

    // Nothing to wait for here: the point is that the figure never changes.
    // Waiting on the call the effect makes is what proves the effect ran.
    await waitFor(() => expect(incrementMock).toHaveBeenCalled())
    expect(container.textContent).toContain("42")
  })

  /**
   * The write ran on every mount, so a reader who reloaded a post five times
   * was five views, and every DynamoDB write is billed. The record is
   * permanent by choice: a second visit next month is not a second view.
   */
  describe("counting once", () => {
    test("a second visit does not write again", async () => {
      const { unmount } = render(
        <ViewCounter slug="repeat" count={7} label="VIEWS" />,
      )
      await waitFor(() => expect(incrementMock).toHaveBeenCalledTimes(1))
      unmount()

      render(<ViewCounter slug="repeat" count={8} label="VIEWS" />)
      await Promise.resolve()

      expect(incrementMock).toHaveBeenCalledTimes(1)
    })

    test("another post is still counted", async () => {
      render(<ViewCounter slug="first" count={1} label="VIEWS" />)
      await waitFor(() => expect(incrementMock).toHaveBeenCalledTimes(1))
      cleanup()

      render(<ViewCounter slug="second" count={1} label="VIEWS" />)
      await waitFor(() => expect(incrementMock).toHaveBeenCalledTimes(2))
      expect(incrementMock).toHaveBeenLastCalledWith("second")
    })

    // Not writing again also means the write no longer reports a figure, and
    // the prop is frozen into the cache entry. The page's read is what keeps
    // a returning reader from seeing that frozen number.
    test("a second visit shows the count the page reads", async () => {
      localStorage.setItem("blog:viewed:repeat", "1")
      readResult = { repeat: 12 }
      const { container } = render(
        <ViewCountsProvider slugs={["repeat"]}>
          <ViewCounter slug="repeat" count={0} label="VIEWS" />
        </ViewCountsProvider>,
      )

      await waitFor(() => expect(container.textContent).toContain("12"))
      expect(incrementMock).not.toHaveBeenCalled()
    })

    // Both requests go out together on a first visit, and the read may have
    // been answered before the write landed.
    test("the recorded count wins over the page's read", async () => {
      actionResult = 13
      readResult = { fresh: 12 }
      const { container } = render(
        <ViewCountsProvider slugs={["fresh"]}>
          <ViewCounter slug="fresh" count={0} label="VIEWS" />
        </ViewCountsProvider>,
      )

      await waitFor(() => expect(container.textContent).toContain("13"))
      await Promise.resolve()
      expect(container.textContent).toContain("13")
    })

    // Private browsing, or a browser set to block site data: the accessor
    // itself throws. A counter that stops counting there would be a silent
    // undercount.
    test("a browser that refuses storage is still counted", async () => {
      const original = Object.getOwnPropertyDescriptor(
        globalThis,
        "localStorage",
      )
      Object.defineProperty(globalThis, "localStorage", {
        configurable: true,
        get() {
          throw new Error("SecurityError")
        },
      })

      try {
        render(<ViewCounter slug="private" count={3} label="VIEWS" />)
        await waitFor(() => expect(incrementMock).toHaveBeenCalledTimes(1))
      } finally {
        if (original) {
          Object.defineProperty(globalThis, "localStorage", original)
        }
      }
    })
  })
})
