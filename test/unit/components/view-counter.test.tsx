import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test"
import { cleanup, render, waitFor } from "@testing-library/react"
import { matchMediaStub, stubGlobals } from "../stub-global"

// Mock the calls to /api/views. The write returns the count it recorded; the
// read is what the page's provider makes for this post and its related cards.
let actionResult: Promise<number | null> = Promise.resolve(null)
let readResult: Promise<Record<string, number>> = Promise.resolve({})
const incrementMock = mock(() => actionResult)
const readMock = mock(() => readResult)
// Both exports are stubbed: bun applies mock.module globally for the run, so
// a partial mock makes the missing export disappear for every other test file
// too.
mock.module("@/lib/views/client", () => ({
  fetchViewCounts: readMock,
  recordView: incrementMock,
}))

let restore: () => void = () => {}

beforeEach(() => {
  // Most cases are about which figure wins, not how it arrives, so they run
  // with the scramble switched off and the figure lands at once.
  restore = stubGlobals({ matchMedia: matchMediaStub(true) })
})

afterEach(() => {
  cleanup()
  restore()
  incrementMock.mockClear()
  readMock.mockClear()
  actionResult = Promise.resolve(null)
  readResult = Promise.resolve({})
  // The counter records what it has counted, and the record outlives a render.
  try {
    localStorage.clear()
  } catch {}
})

const { ViewCounter } = await import("@/components/view-counter")
const { ViewCountsProvider } = await import("@/components/view-counts")

function renderCounter(slug: string, count: number) {
  return render(
    <ViewCountsProvider slugs={[slug]}>
      <ViewCounter slug={slug} count={count} label="VIEWS" />
    </ViewCountsProvider>,
  )
}

function shown(container: HTMLElement): string {
  return container.querySelector(".pp-glitch-count")?.textContent ?? ""
}

function settled(container: HTMLElement): boolean {
  return (
    container.querySelector(".pp-glitch-count")?.getAttribute("data-state") ===
    "settled"
  )
}

function deferred<T>() {
  let resolve: (value: T) => void = () => {}
  const promise = new Promise<T>((r) => {
    resolve = r
  })
  return { promise, resolve }
}

describe("ViewCounter", () => {
  // The only figure the server has is the one frozen into the page's cache
  // entry, zero on a cold start. Showing it until the browser knows better
  // is the bug this counter was rebuilt around.
  test("shows dashes, not the cached figure, until something answers", () => {
    readResult = new Promise(() => {})
    actionResult = new Promise(() => {})
    const { container } = renderCounter("test-post", 42)

    expect(shown(container)).toBe("----")
    expect(container.textContent).toContain("VIEWS")
    expect(container.textContent).not.toContain("42")
  })

  test("records a view on mount", async () => {
    renderCounter("my-slug", 10)

    await waitFor(() => expect(incrementMock).toHaveBeenCalledTimes(1))
    expect(incrementMock).toHaveBeenCalledWith("my-slug")
  })

  test("formats large numbers with locale separators", async () => {
    actionResult = Promise.resolve(1234567)
    const { container } = renderCounter("popular", 0)

    await waitFor(() => expect(settled(container)).toBe(true))
    expect(shown(container)).toBe((1234567).toLocaleString())
    expect(shown(container)).not.toBe("1234567")
  })

  test("shows the count the write recorded", async () => {
    actionResult = Promise.resolve(43)
    const { container } = renderCounter("test-post", 42)

    await waitFor(() => expect(shown(container)).toBe("43"))
  })

  test("falls back to the rendered figure when nothing reports a count", async () => {
    // No database configured, or the write failed. The rendered figure is
    // stale, but it is the only one there is.
    const { container } = renderCounter("test-post", 42)

    await waitFor(() => expect(settled(container)).toBe(true))
    expect(shown(container)).toBe("42")
  })

  test("a failed read does not leave the number scrambling", async () => {
    readResult = Promise.reject(new Error("offline"))
    const { container } = renderCounter("test-post", 42)

    await waitFor(() => expect(settled(container)).toBe(true))
    expect(shown(container)).toBe("42")
  })

  // The digits are hidden from assistive technology because they change
  // many times a second; the settled figure is announced on its own.
  test("announces the figure only once it has settled", async () => {
    const write = deferred<number | null>()
    actionResult = write.promise
    const { container } = renderCounter("test-post", 0)

    expect(container.querySelector(".sr-only")).toBeNull()
    expect(
      container.querySelector(".pp-glitch-count")?.getAttribute("aria-hidden"),
    ).toBe("true")

    write.resolve(7)
    await waitFor(() =>
      expect(container.querySelector(".sr-only")?.textContent).toBe("7"),
    )
  })

  /**
   * The write ran on every mount, so a reader who reloaded a post five times
   * was five views, and every DynamoDB write is billed. The record is
   * permanent by choice: a second visit next month is not a second view.
   */
  describe("counting once", () => {
    test("a second visit does not write again", async () => {
      const { unmount } = renderCounter("repeat", 7)
      await waitFor(() => expect(incrementMock).toHaveBeenCalledTimes(1))
      unmount()

      renderCounter("repeat", 8)
      await Promise.resolve()

      expect(incrementMock).toHaveBeenCalledTimes(1)
    })

    test("another post is still counted", async () => {
      renderCounter("first", 1)
      await waitFor(() => expect(incrementMock).toHaveBeenCalledTimes(1))
      cleanup()

      renderCounter("second", 1)
      await waitFor(() => expect(incrementMock).toHaveBeenCalledTimes(2))
      expect(incrementMock).toHaveBeenLastCalledWith("second")
    })

    // Not writing again also means the write no longer reports a figure, and
    // the prop is frozen into the cache entry. The page's read is what keeps
    // a returning reader from seeing that frozen number.
    test("a second visit shows the count the page reads", async () => {
      localStorage.setItem("blog:viewed:repeat", "1")
      readResult = Promise.resolve({ repeat: 12 })
      const { container } = renderCounter("repeat", 0)

      await waitFor(() => expect(shown(container)).toBe("12"))
      expect(incrementMock).not.toHaveBeenCalled()
    })

    // Both requests go out together on a first visit, and the read may have
    // been answered before the write landed, so it is not enough to settle.
    test("a first visit waits for the write rather than settling on the read", async () => {
      const write = deferred<number | null>()
      actionResult = write.promise
      readResult = Promise.resolve({ fresh: 12 })
      const { container } = renderCounter("fresh", 0)

      await waitFor(() => expect(readMock).toHaveBeenCalled())
      await Promise.resolve()
      expect(settled(container)).toBe(false)

      write.resolve(13)
      await waitFor(() => expect(shown(container)).toBe("13"))
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
        renderCounter("private", 3)
        await waitFor(() => expect(incrementMock).toHaveBeenCalledTimes(1))
      } finally {
        if (original) {
          Object.defineProperty(globalThis, "localStorage", original)
        }
      }
    })
  })

  describe("the scramble", () => {
    beforeEach(() => {
      restore()
      restore = stubGlobals({ matchMedia: matchMediaStub(false) })
    })

    test("cycles digits while the figure is unknown", async () => {
      readResult = new Promise(() => {})
      actionResult = new Promise(() => {})
      const { container } = renderCounter("spin", 0)

      await waitFor(() => expect(shown(container)).toMatch(/^\d{4}$/))
      expect(settled(container)).toBe(false)
    })

    test("locks in on the figure once it arrives", async () => {
      actionResult = Promise.resolve(1284)
      const { container } = renderCounter("lock", 0)

      await waitFor(() => expect(settled(container)).toBe(true), {
        timeout: 3000,
      })
      expect(shown(container)).toBe((1284).toLocaleString())
    })
  })

  describe("reduced motion", () => {
    test("holds still on the dashes instead of cycling digits", async () => {
      readResult = new Promise(() => {})
      actionResult = new Promise(() => {})
      const { container } = renderCounter("still", 0)

      await new Promise((r) => setTimeout(r, 150))
      expect(shown(container)).toBe("----")
    })
  })
})
