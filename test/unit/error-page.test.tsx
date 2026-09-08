import { afterEach, describe, expect, mock, test } from "bun:test"
import { cleanup, fireEvent, render } from "@testing-library/react"
import { renderToStaticMarkup } from "react-dom/server"
import { nextNavigationMock } from "./setup-next-navigation-mock"

/**
 * The two error boundaries have no reachable URL — nothing renders them until
 * something throws — so they get unit tests rather than the e2e coverage the
 * 404 has.
 *
 * `next/font` only resolves under Next's build transform, so the shared font
 * module is stubbed. It contributes a `className` string and nothing else.
 */
mock.module("@/lib/fonts", () => ({ fontVars: "font-vars-stub" }))

// The preloaded mock returns a fixed "/en"; both boundaries read the locale
// out of the pathname, so this file needs to move it. Spreading is mandatory:
// bun's mock.module replaces the whole module for the entire run, and a
// partial override makes the missing exports disappear for every other file.
let pathname = "/en"
mock.module("next/navigation", () => ({
  ...nextNavigationMock,
  usePathname: () => pathname,
}))

const { default: ErrorPage } = await import("@/app/[locale]/error.tsx")
const { default: GlobalError } = await import("@/app/global-error.tsx")

afterEach(() => {
  cleanup()
  pathname = "/en"
})

function fault(digest?: string) {
  return Object.assign(new Error("boom"), digest ? { digest } : {})
}

describe("app/[locale]/error.tsx", () => {
  test("renders the fault report in the locale of the pathname", () => {
    const { container } = render(<ErrorPage error={fault()} retry={() => {}} />)

    expect(container.textContent).toContain("SYSTEM FAULT")
    expect(container.textContent).toContain("SIBYL // FAULT REPORT")
    expect(container.textContent).toContain("RETRY")
    expect(container.textContent).toContain("500")
  })

  test("follows the reader into Japanese", () => {
    pathname = "/ja/blog/some-post"
    const { container } = render(<ErrorPage error={fault()} retry={() => {}} />)

    expect(container.textContent).toContain("システム障害")
    expect(container.textContent).toContain("再試行")
  })

  test("falls back to the default locale for an unknown segment", () => {
    // A fault on a path the router never matched still has to read as English
    // rather than crashing on a missing dictionary.
    pathname = "/fr/whatever"
    const { container } = render(<ErrorPage error={fault()} retry={() => {}} />)

    expect(container.textContent).toContain("SYSTEM FAULT")
    expect(container.querySelector("a")?.getAttribute("href")).toBe("/en")
  })

  test("the way home keeps the locale", () => {
    pathname = "/ja"
    const { container } = render(<ErrorPage error={fault()} retry={() => {}} />)

    expect(container.querySelector("a")?.getAttribute("href")).toBe("/ja")
  })

  test("shows the trace chip only when the build produced a digest", () => {
    const without = render(<ErrorPage error={fault()} retry={() => {}} />)
    expect(without.container.textContent).not.toContain("TRACE")
    cleanup()

    const { container } = render(
      <ErrorPage error={fault("a1b2c3d4")} retry={() => {}} />,
    )
    expect(container.textContent).toContain("TRACE")
    expect(container.textContent).toContain("a1b2c3d4")
  })

  test("the button re-fetches rather than only re-rendering", () => {
    // `retry` is the prop that refetches the segment. Wiring the button to
    // `reset` instead would leave it silently useless for the transient
    // failures it exists for, and nothing else here would notice.
    const retry = mock(() => {})
    const { getByRole } = render(<ErrorPage error={fault()} retry={retry} />)

    fireEvent.click(getByRole("button"))
    expect(retry).toHaveBeenCalledTimes(1)
  })
})

/**
 * `global-error.tsx` is rendered to a string rather than into the DOM.
 *
 * React treats `<html>`, `<head>` and `<body>` as singletons: it applies them
 * to the real document instead of nesting copies inside a test container, which
 * takes Testing Library's container out from under it and leaves every later
 * test file rendering into a document that was never cleaned up. That is not
 * hypothetical — it broke `portfolio-page.test.tsx` from here.
 *
 * Rendering to markup is also the truthful case: when the root layout fails,
 * this page reaches the reader as server-rendered HTML.
 */
function markupOf(error: Error & { digest?: string }) {
  return renderToStaticMarkup(<GlobalError error={error} retry={() => {}} />)
}

describe("app/global-error.tsx", () => {
  test("brings its own document, since it replaces the root layout", () => {
    const markup = markupOf(fault())

    expect(markup).toContain('<html lang="en"')
    // Nothing above this file supplies the fonts; it has to carry them itself.
    expect(markup).toContain("font-vars-stub")
    expect(markup).toContain("<body")
  })

  test("names the tab, which no metadata export can do here", () => {
    expect(markupOf(fault())).toContain("<title>500 · SYSTEM FAULT")
  })

  test("speaks both languages, because the locale may never have resolved", () => {
    const markup = markupOf(fault())

    expect(markup).toContain("SYSTEM FAULT")
    expect(markup).toContain("システム障害")
    expect(markup).toContain("再試行")
  })

  test("offers a plain anchor home, with no router to depend on", () => {
    // next/link needs a router tree that may be the very thing that failed.
    expect(markupOf(fault())).toContain('<a href="/en"')
  })

  test("shows the trace chip only when the build produced a digest", () => {
    expect(markupOf(fault())).not.toContain("TRACE")
    expect(markupOf(fault("f00dcafe"))).toContain("f00dcafe")
  })

  test("carries the theme script, so the fault page is not a white flash", () => {
    // The layout's copy is gone with the layout. Without this the dark-mode
    // reader gets a full-page flash at the worst possible moment.
    expect(markupOf(fault())).toContain('localStorage.getItem("theme")')
  })
})
