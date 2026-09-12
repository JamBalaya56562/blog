import { afterEach, describe, expect, mock, test } from "bun:test"
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react"
import { nextNavigationMock } from "../setup-next-navigation-mock"

// The router is a recorder, and the URL is a value the test moves by hand:
// pushing records the href, and "the navigation landed" is a rerender after
// `nav.params` has been pointed at the pushed query. That gap between the two
// is where the reader keeps typing.
const nav = {
  params: new URLSearchParams(),
  pushed: [] as string[],
}

mock.module("next/navigation", () => ({
  ...nextNavigationMock,
  useRouter: () => ({
    ...nextNavigationMock.useRouter(),
    push: (href: string) => {
      nav.pushed.push(href)
    },
  }),
  useSearchParams: () => nav.params,
}))

const { SearchInput } = await import("@/components/search-input")

const DEBOUNCE_MS = 300

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function renderInput() {
  return render(
    <SearchInput
      placeholder="// search"
      label="Search"
      searchingLabel="SEARCHING"
      basePath="/en/blog"
    />,
  )
}

afterEach(() => {
  cleanup()
  nav.params = new URLSearchParams()
  nav.pushed = []
})

describe("SearchInput", () => {
  test("a keystroke reaches the router once the debounce has passed", async () => {
    renderInput()
    const input = screen.getByRole<HTMLInputElement>("searchbox")

    fireEvent.change(input, { target: { value: "in" } })
    expect(nav.pushed).toEqual([])

    await act(() => sleep(DEBOUNCE_MS + 50))
    expect(nav.pushed).toEqual(["/en/blog?q=in"])
  })

  // The bug this pins: the reader types "in", the navigation for it is sent,
  // they type "tro" before it lands, and landing used to reset the input to
  // the URL's "in". Whatever was typed after the send was lost.
  test("a navigation landing mid-typing does not overwrite the input", async () => {
    const { rerender } = renderInput()
    const input = screen.getByRole<HTMLInputElement>("searchbox")

    fireEvent.change(input, { target: { value: "in" } })
    await act(() => sleep(DEBOUNCE_MS + 50))
    expect(nav.pushed).toEqual(["/en/blog?q=in"])

    fireEvent.change(input, { target: { value: "intro" } })

    nav.params = new URLSearchParams("q=in")
    rerender(
      <SearchInput
        placeholder="// search"
        label="Search"
        searchingLabel="SEARCHING"
        basePath="/en/blog"
      />,
    )

    expect(input.value).toBe("intro")
  })

  test("a URL changed by something other than the input does replace it", () => {
    nav.params = new URLSearchParams("q=first")
    const { rerender } = renderInput()
    const input = screen.getByRole<HTMLInputElement>("searchbox")
    expect(input.value).toBe("first")

    // The back button, or a tag chip that carries a different query.
    nav.params = new URLSearchParams()
    rerender(
      <SearchInput
        placeholder="// search"
        label="Search"
        searchingLabel="SEARCHING"
        basePath="/en/blog"
      />,
    )

    expect(input.value).toBe("")
  })

  test("the status reads as searching from the first keystroke until the URL catches up", async () => {
    const { rerender } = renderInput()
    const input = screen.getByRole<HTMLInputElement>("searchbox")
    const status = screen.getByRole("status")
    expect(status.textContent).toBe("")

    fireEvent.change(input, { target: { value: "in" } })
    expect(status.textContent).toBe("SEARCHING")
    expect(status.dataset.searching).toBe("true")

    await act(() => sleep(DEBOUNCE_MS + 50))
    nav.params = new URLSearchParams("q=in")
    rerender(
      <SearchInput
        placeholder="// search"
        label="Search"
        searchingLabel="SEARCHING"
        basePath="/en/blog"
      />,
    )

    expect(status.textContent).toBe("")
    expect(status.dataset.searching).toBeUndefined()
  })

  test("typing back to what the page already shows sends nothing", async () => {
    nav.params = new URLSearchParams("q=in")
    renderInput()
    const input = screen.getByRole<HTMLInputElement>("searchbox")

    fireEvent.change(input, { target: { value: "i" } })
    fireEvent.change(input, { target: { value: "in" } })
    await act(() => sleep(DEBOUNCE_MS + 50))

    expect(nav.pushed).toEqual([])
    expect(screen.getByRole("status").textContent).toBe("")
  })

  // A sort chip clicked inside the debounce window lands before the timer
  // fires. The send has to be built from the URL as it is then, not from the
  // one the keystroke saw, or the sort is pushed away again.
  test("a send built after another control changed the URL keeps that change", async () => {
    const { rerender } = renderInput()
    const input = screen.getByRole<HTMLInputElement>("searchbox")

    fireEvent.change(input, { target: { value: "in" } })

    nav.params = new URLSearchParams("sort=popular")
    rerender(
      <SearchInput
        placeholder="// search"
        label="Search"
        searchingLabel="SEARCHING"
        basePath="/en/blog"
      />,
    )
    await act(() => sleep(DEBOUNCE_MS + 50))

    expect(nav.pushed).toEqual(["/en/blog?sort=popular&q=in"])
    expect(input.value).toBe("in")
  })

  // The clear-search link, or a tag chip that drops the query, taken while a
  // draft is still waiting: the reader's explicit action wins, and the draft
  // is not sent over it a moment later.
  test("a query set by something else drops the draft that was waiting", async () => {
    nav.params = new URLSearchParams("q=first")
    const { rerender } = renderInput()
    const input = screen.getByRole<HTMLInputElement>("searchbox")

    fireEvent.change(input, { target: { value: "first draft" } })

    nav.params = new URLSearchParams()
    rerender(
      <SearchInput
        placeholder="// search"
        label="Search"
        searchingLabel="SEARCHING"
        basePath="/en/blog"
      />,
    )
    await act(() => sleep(DEBOUNCE_MS + 50))

    expect(nav.pushed).toEqual([])
    expect(input.value).toBe("")
  })

  // An IME hands over text in pieces while the reader is still choosing the
  // characters. Nothing is sent until the composition ends, and then the
  // final text is.
  test("nothing is sent while an IME composition is open", async () => {
    renderInput()
    const input = screen.getByRole<HTMLInputElement>("searchbox")

    fireEvent.compositionStart(input)
    fireEvent.change(input, { target: { value: "にゅ" } })
    fireEvent.change(input, { target: { value: "にゅうもん" } })
    await act(() => sleep(DEBOUNCE_MS + 50))
    expect(nav.pushed).toEqual([])

    fireEvent.change(input, { target: { value: "入門" } })
    fireEvent.compositionEnd(input)
    await act(() => sleep(DEBOUNCE_MS + 50))
    expect(nav.pushed).toEqual([`/en/blog?q=${encodeURIComponent("入門")}`])
  })
})
