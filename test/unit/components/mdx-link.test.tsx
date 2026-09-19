import { afterEach, describe, expect, test } from "bun:test"
import { cleanup, render } from "@testing-library/react"
import { useMDXComponents } from "@/mdx-components"

afterEach(cleanup)

// Looked up inside a component because the lint reads `useMDXComponents` as
// a hook.
function Host(props: Record<string, unknown>) {
  const Anchor = useMDXComponents().a as React.ComponentType<
    Record<string, unknown>
  >
  return <Anchor {...props}>text</Anchor>
}

function renderLink(props: Record<string, unknown>) {
  return render(<Host {...props} />).container
}

describe("a link in a post", () => {
  test("to another site carries that site's favicon before the text", () => {
    const container = renderLink({ href: "https://github.com/aws" })
    const a = container.querySelector("a")
    const img = a?.querySelector("img")
    expect(a?.getAttribute("href")).toBe("https://github.com/aws")
    expect(img?.getAttribute("src")).toBe("/api/favicons/github.com")
    expect(img?.getAttribute("alt")).toBe("")
    expect(img?.getAttribute("aria-hidden")).toBe("true")
    expect(img?.getAttribute("loading")).toBe("lazy")
    expect(a?.firstElementChild).toBe(img ?? null)
    expect(a?.textContent).toBe("text")
  })

  test("within the site carries nothing", () => {
    for (const href of ["/ja/blog/x", "#setup", "mailto:a@b.c"]) {
      const container = renderLink({ href })
      expect(container.querySelector("img")).toBeNull()
      expect(container.querySelector("a")?.textContent).toBe("text")
    }
  })

  test("keeps the other attributes it was given", () => {
    const container = renderLink({
      href: "https://example.org/",
      id: "ref",
      title: "Example",
    })
    const a = container.querySelector("a")
    expect(a?.getAttribute("id")).toBe("ref")
    expect(a?.getAttribute("title")).toBe("Example")
  })
})
