import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test"
import { cleanup, render, waitFor } from "@testing-library/react"
import { StrictMode } from "react"
import { matchMediaStub, stubGlobals } from "../stub-global"

// Mock the calls to /api/views. The write returns the count it recorded; the
// read is what the page's provider makes for this post and its related cards.
let actionResult: Promise<number | null> = Promise.resolve(null)
let readResult: Promise<Record<string, number>> = Promise.resolve({})
const incrementMock = mock(() => actionResult)
const readMock = mock(() => readResult)
// Both exports are stubbed: without `--isolate`, a partial mock takes the
// missing export away from later files.
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
const { RECOUNT_AFTER_MS } = await import("@/lib/views/recount")

function renderCounter(slug: string) {
  return render(
    <ViewCountsProvider slugs={[slug]}>
      <ViewCounter slug={slug} locale="en" label="VIEWS" />
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
  // The page renders no figure: the only one the server has is frozen into
  // the page's cache entry, zero on a cold start. Dashes until the browser
  // knows better.
  test("shows dashes until something answers", () => {
    readResult = new Promise(() => {})
    actionResult = new Promise(() => {})
    const { container } = renderCounter("test-post")

    expect(shown(container)).toBe("----")
    expect(container.textContent).toContain("VIEWS")
  })

  test("records a view on mount", async () => {
    renderCounter("my-slug")

    await waitFor(() => expect(incrementMock).toHaveBeenCalledTimes(1))
    expect(incrementMock).toHaveBeenCalledWith("my-slug")
  })

  test("formats large numbers with locale separators", async () => {
    actionResult = Promise.resolve(1234567)
    const { container } = renderCounter("popular")

    await waitFor(() => expect(settled(container)).toBe(true))
    expect(shown(container)).toBe("1,234,567")
  })

  // The separators came from the browser's language, not the page's: an
  // English page read in a German browser showed "1.234.567". The browser's
  // default is stood in for by making toLocaleString() default to German.
  test("groups digits the way the page's language does, not the browser's", async () => {
    const original = Number.prototype.toLocaleString
    Number.prototype.toLocaleString = function (
      this: number,
      locales?: Intl.LocalesArgument,
      options?: Intl.NumberFormatOptions,
    ) {
      return original.call(this, locales ?? "de-DE", options)
    }
    try {
      actionResult = Promise.resolve(1234567)
      const { container } = renderCounter("german-browser")

      await waitFor(() => expect(settled(container)).toBe(true))
      expect(shown(container)).toBe("1,234,567")
    } finally {
      Number.prototype.toLocaleString = original
    }
  })

  test("shows the count the write recorded", async () => {
    actionResult = Promise.resolve(43)
    const { container } = renderCounter("test-post")

    await waitFor(() => expect(shown(container)).toBe("43"))
  })

  // No database configured, or a crawler, which the write does not count:
  // the read answering without this post is what a post nobody has viewed
  // looks like.
  test("a post the read has no count for shows 0", async () => {
    const { container } = renderCounter("test-post")

    await waitFor(() => expect(settled(container)).toBe(true))
    expect(shown(container)).toBe("0")
  })

  test("a failed read does not leave the number scrambling", async () => {
    readResult = Promise.reject(new Error("offline"))
    const { container } = renderCounter("test-post")

    await waitFor(() => expect(settled(container)).toBe(true))
    expect(shown(container)).toBe("0")
  })

  // The digits are hidden from assistive technology because they change
  // many times a second; the settled figure is announced on its own.
  test("announces the figure only once it has settled", async () => {
    const write = deferred<number | null>()
    actionResult = write.promise
    const { container } = renderCounter("test-post")

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
   * was five views, and every DynamoDB write is billed. The record holds for a
   * day: a reload is not another view, a visit the next day is.
   */
  describe("counting once a day", () => {
    test("a second visit the same day does not write again", async () => {
      actionResult = Promise.resolve(1)
      const { unmount } = renderCounter("repeat")
      await waitFor(() => expect(incrementMock).toHaveBeenCalledTimes(1))
      unmount()

      renderCounter("repeat")
      await Promise.resolve()

      expect(incrementMock).toHaveBeenCalledTimes(1)
    })

    test("another post is still counted", async () => {
      renderCounter("first")
      await waitFor(() => expect(incrementMock).toHaveBeenCalledTimes(1))
      cleanup()

      renderCounter("second")
      await waitFor(() => expect(incrementMock).toHaveBeenCalledTimes(2))
      expect(incrementMock).toHaveBeenLastCalledWith("second")
    })

    // Not writing again also means the write reports no figure. The page's
    // read is what shows a returning reader the current count.
    test("a second visit shows the count the page reads", async () => {
      localStorage.setItem("blog:viewed:repeat", String(Date.now() - 60_000))
      readResult = Promise.resolve({ repeat: 12 })
      const { container } = renderCounter("repeat")

      await waitFor(() => expect(shown(container)).toBe("12"))
      expect(incrementMock).not.toHaveBeenCalled()
    })

    test("records the time it counted", async () => {
      actionResult = Promise.resolve(1)
      const before = Date.now()
      renderCounter("stamped")
      await waitFor(() =>
        expect(localStorage.getItem("blog:viewed:stamped")).not.toBeNull(),
      )

      const stored = Number(localStorage.getItem("blog:viewed:stamped"))
      expect(stored).toBeGreaterThanOrEqual(before)
      expect(stored).toBeLessThanOrEqual(Date.now())
    })

    test("a visit a day after the last count is counted again", async () => {
      localStorage.setItem(
        "blog:viewed:again",
        String(Date.now() - RECOUNT_AFTER_MS - 1000),
      )
      renderCounter("again")

      await waitFor(() => expect(incrementMock).toHaveBeenCalledTimes(1))
      expect(incrementMock).toHaveBeenCalledWith("again")
    })

    // Records from before the window held "1" rather than a time. Each counts
    // once more, and is then rewritten with a time like any other.
    test("a record without a time is counted once more, then holds", async () => {
      localStorage.setItem("blog:viewed:legacy", "1")
      actionResult = Promise.resolve(1)
      const { unmount } = renderCounter("legacy")
      await waitFor(() =>
        expect(localStorage.getItem("blog:viewed:legacy")).not.toBe("1"),
      )
      unmount()

      renderCounter("legacy")
      await Promise.resolve()
      expect(incrementMock).toHaveBeenCalledTimes(1)
      expect(localStorage.getItem("blog:viewed:legacy")).not.toBe("1")
    })

    // The record was written before the POST went out, so a write that
    // failed held the post as counted for a day and the visit was never
    // counted. Nothing is recorded until the write reports a count.
    test("a write that records nothing is not remembered", async () => {
      const write = deferred<number | null>()
      actionResult = write.promise
      const { unmount } = renderCounter("failed")
      await waitFor(() => expect(incrementMock).toHaveBeenCalledTimes(1))
      expect(localStorage.getItem("blog:viewed:failed")).toBeNull()

      write.resolve(null)
      await write.promise
      await Promise.resolve()
      expect(localStorage.getItem("blog:viewed:failed")).toBeNull()
      unmount()

      renderCounter("failed")
      await waitFor(() => expect(incrementMock).toHaveBeenCalledTimes(2))
    })

    // Development runs every effect twice for one mount. With the record no
    // longer written up front, the second run must reuse the first run's
    // write rather than send its own.
    test("an effect run twice for one mount sends one write", async () => {
      actionResult = Promise.resolve(8)
      const { container } = render(
        <StrictMode>
          <ViewCountsProvider slugs={["strict"]}>
            <ViewCounter slug="strict" locale="en" label="VIEWS" />
          </ViewCountsProvider>
        </StrictMode>,
      )

      await waitFor(() => expect(shown(container)).toBe("8"))
      expect(incrementMock).toHaveBeenCalledTimes(1)
    })

    // Both requests go out together on a first visit, and the read may have
    // been answered before the write landed, so it is not enough to settle.
    test("a first visit waits for the write rather than settling on the read", async () => {
      const write = deferred<number | null>()
      actionResult = write.promise
      readResult = Promise.resolve({ fresh: 12 })
      const { container } = renderCounter("fresh")

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
        renderCounter("private")
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
      const { container } = renderCounter("spin")

      await waitFor(() => expect(shown(container)).toMatch(/^\d{4}$/))
      expect(settled(container)).toBe(false)
    })

    test("locks in on the figure once it arrives", async () => {
      actionResult = Promise.resolve(1284)
      const { container } = renderCounter("lock")

      await waitFor(() => expect(settled(container)).toBe(true), {
        timeout: 3000,
      })
      expect(shown(container)).toBe("1,284")
    })
  })

  describe("reduced motion", () => {
    test("holds still on the dashes instead of cycling digits", async () => {
      readResult = new Promise(() => {})
      actionResult = new Promise(() => {})
      const { container } = renderCounter("still")

      await new Promise((r) => setTimeout(r, 150))
      expect(shown(container)).toBe("----")
    })
  })
})
