import { afterEach, describe, expect, test } from "bun:test"
import { cleanup, render } from "@testing-library/react"
import { useMDXComponents } from "@/mdx-components"

afterEach(cleanup)

// remark-rehype hands `hProperties` to the element as ordinary props, so the
// component sees `data-alert` exactly as the plugin set it. Looked up inside
// a component because the lint reads `useMDXComponents` as a hook.
function Host(props: Record<string, unknown>) {
  const Blockquote = useMDXComponents().blockquote as React.ComponentType<
    Record<string, unknown>
  >
  return (
    <Blockquote {...props}>
      <p>Body.</p>
    </Blockquote>
  )
}

function renderBlockquote(props: Record<string, unknown>) {
  return render(<Host {...props} />)
}

describe("blockquote as an alert", () => {
  test("without a tag it is a plain blockquote", () => {
    const { container } = renderBlockquote({})
    expect(container.querySelector("blockquote")).not.toBeNull()
    expect(container.querySelector("aside")).toBeNull()
  })

  test("with a tag it is an aside carrying the kind and an uppercase label", () => {
    const { container } = renderBlockquote({ "data-alert": "warning" })
    const aside = container.querySelector("aside")
    expect(aside).not.toBeNull()
    expect(aside?.getAttribute("role")).toBe("note")
    expect(aside?.getAttribute("data-alert")).toBe("warning")
    expect(aside?.querySelector(".pp-alert-label")?.textContent).toBe(
      "◢ WARNING",
    )
    expect(aside?.textContent).toContain("Body.")
    expect(container.querySelector("blockquote")).toBeNull()
  })
})

describe("blockquote as an alert, with extra attributes", () => {
  test("other attributes reach the aside, and the callout's own win", () => {
    const { container } = renderBlockquote({
      "aria-label": "hint",
      className: "authored",
      "data-alert": "tip",
      id: "install-hint",
    })
    const aside = container.querySelector("aside")
    expect(aside?.id).toBe("install-hint")
    expect(aside?.getAttribute("aria-label")).toBe("hint")
    expect(aside?.className).toBe("pp-alert my-4")
    expect(aside?.getAttribute("role")).toBe("note")
  })
})
