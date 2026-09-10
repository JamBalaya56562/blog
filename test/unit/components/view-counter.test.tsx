import { afterEach, describe, expect, mock, test } from "bun:test"
import { cleanup, render, waitFor } from "@testing-library/react"

// Mock the server action. It returns the count recorded by the write, which
// is what the counter shows once the effect resolves.
let actionResult: number | null = null
const incrementMock = mock(() => Promise.resolve(actionResult))
// Both exports are stubbed even though this file only needs one: bun applies
// mock.module globally for the run, so a partial mock makes the missing export
// disappear for every other test file too.
mock.module("@/lib/actions/view-count", () => ({
  getViewCountsAction: mock(() => Promise.resolve({})),
  incrementViewCountAction: incrementMock,
}))

afterEach(() => {
  cleanup()
  incrementMock.mockClear()
  actionResult = null
  // The counter records what it has counted, and the record outlives a render.
  try {
    localStorage.clear()
  } catch {}
})

const { ViewCounter } = await import("@/components/view-counter")

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
