import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test"
import { cleanup, render, waitFor } from "@testing-library/react"

const fetchMock = mock<typeof globalThis.fetch>()

beforeEach(() => {
  globalThis.fetch = fetchMock as typeof globalThis.fetch
  fetchMock.mockReset()
})

afterEach(cleanup)

const { ViewCounter } = await import("@/components/view-counter")

describe("ViewCounter", () => {
  test("renders nothing initially before fetch completes", () => {
    fetchMock.mockImplementation(
      () => new Promise<Response>(() => {}), // never resolves
    )

    const { container } = render(<ViewCounter slug="test-post" />)
    expect(container.textContent).toBe("")
  })

  test("displays view count after successful fetch", async () => {
    fetchMock
      .mockResolvedValueOnce(new Response(JSON.stringify({ success: true })))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ slug: "test-post", count: 42 })),
      )

    const { container } = render(<ViewCounter slug="test-post" />)

    await waitFor(() => {
      expect(container.textContent).toContain("42")
      expect(container.textContent).toContain("views")
    })
  })

  test("sends POST then GET to correct URL", async () => {
    fetchMock
      .mockResolvedValueOnce(new Response(JSON.stringify({ success: true })))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ slug: "my-slug", count: 10 })),
      )

    render(<ViewCounter slug="my-slug" />)

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2)
    })

    const [postCall, getCall] = fetchMock.mock.calls
    expect(postCall[0]).toBe("/api/views/my-slug")
    expect((postCall[1] as RequestInit).method).toBe("POST")
    expect(getCall[0]).toBe("/api/views/my-slug")
  })

  test("encodes slug with special characters", async () => {
    fetchMock
      .mockResolvedValueOnce(new Response(JSON.stringify({ success: true })))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ slug: "hello world", count: 1 })),
      )

    render(<ViewCounter slug="hello world" />)

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2)
    })

    const [postCall] = fetchMock.mock.calls
    expect(postCall[0]).toBe("/api/views/hello%20world")
  })

  test("renders nothing when fetch fails", async () => {
    fetchMock.mockRejectedValue(new Error("Network error"))

    const { container } = render(<ViewCounter slug="fail-post" />)

    // Wait a tick for the effect to settle
    await new Promise((r) => setTimeout(r, 50))
    expect(container.textContent).toBe("")
  })

  test("formats large numbers with locale separators", async () => {
    fetchMock
      .mockResolvedValueOnce(new Response(JSON.stringify({ success: true })))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ slug: "popular", count: 1234567 })),
      )

    const { container } = render(<ViewCounter slug="popular" />)

    await waitFor(() => {
      expect(container.textContent).toContain("views")
      // toLocaleString() formats differently by locale, just check it's not raw digits
      expect(container.textContent).not.toContain("1234567")
    })
  })
})
