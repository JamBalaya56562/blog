import { afterEach, describe, expect, test } from "bun:test"
import { cleanup, render } from "@testing-library/react"
import { useMDXComponents } from "@/mdx-components"

afterEach(cleanup)

// Looked up inside a component because the lint reads `useMDXComponents` as
// a hook. The props mirror what Shiki leaves on a highlighted fence: the
// `<code>` carries `language-*`, and a `title="…"` in the fence meta arrives
// as an attribute on the `<pre>`.
function Host({
  title,
  language,
}: Readonly<{ title?: string; language?: string }>) {
  const Pre = useMDXComponents().pre as React.ComponentType<
    Record<string, unknown>
  >
  return (
    <Pre className="shiki" title={title}>
      <code className={language ? `language-${language}` : undefined}>
        mise run dev
      </code>
    </Pre>
  )
}

describe("code block panel", () => {
  test("a titled fence shows the file name and the language in the strip", () => {
    const { container } = render(<Host title="mise.toml" language="toml" />)
    expect(container.querySelector(".pp-code")).not.toBeNull()
    expect(container.querySelector(".pp-code-name")?.textContent).toBe(
      "mise.toml",
    )
    expect(container.querySelector(".pp-code-lang")?.textContent).toBe("toml")
    expect(container.querySelector("pre")?.getAttribute("title")).toBeNull()
  })

  test("an untitled fence still gets the strip, with the language alone", () => {
    const { container } = render(<Host language="bash" />)
    expect(container.querySelector(".pp-code-name")?.textContent).toBe("")
    expect(container.querySelector(".pp-code-lang")?.textContent).toBe("bash")
  })

  test("no language class means no language label", () => {
    const { container } = render(<Host />)
    expect(container.querySelector(".pp-code-title")).not.toBeNull()
    expect(container.querySelector(".pp-code-lang")).toBeNull()
  })
})
