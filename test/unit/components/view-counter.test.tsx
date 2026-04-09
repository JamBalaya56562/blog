import { afterEach, describe, expect, mock, test } from "bun:test"
import { cleanup, render } from "@testing-library/react"

// Mock the server action
const incrementMock = mock(() => Promise.resolve())
mock.module("@/lib/actions/view-count", () => ({
  incrementViewCountAction: incrementMock,
}))

afterEach(() => {
  cleanup()
  incrementMock.mockClear()
})

const { ViewCounter } = await import("@/components/view-counter")

describe("ViewCounter", () => {
  test("renders view count immediately from prop", () => {
    const { container } = render(<ViewCounter slug="test-post" count={42} />)
    expect(container.textContent).toContain("42")
    expect(container.textContent).toContain("views")
  })

  test("calls incrementViewCountAction on mount", async () => {
    render(<ViewCounter slug="my-slug" count={10} />)

    // Wait a tick for the effect to fire
    await new Promise((r) => setTimeout(r, 10))
    expect(incrementMock).toHaveBeenCalledTimes(1)
    expect(incrementMock).toHaveBeenCalledWith("my-slug")
  })

  test("formats large numbers with locale separators", () => {
    const { container } = render(<ViewCounter slug="popular" count={1234567} />)
    expect(container.textContent).toContain("views")
    // toLocaleString() formats differently by locale, just check it's not raw digits
    expect(container.textContent).not.toContain("1234567")
  })

  test("renders 0 views when count is 0", () => {
    const { container } = render(<ViewCounter slug="new-post" count={0} />)
    expect(container.textContent).toContain("0")
    expect(container.textContent).toContain("views")
  })
})
