import { afterEach, describe, expect, test } from "bun:test"
import { cleanup, render } from "@testing-library/react"
import { useMDXComponents } from "@/mdx-components"

afterEach(cleanup)

// The shape Shiki hands the `pre` component for a `console` fence once
// `lib/highlight.ts` has marked the command lines: `.line` spans inside a
// `<code class="language-console">`, the commands carrying `data-cmd`.
function Host({ title }: Readonly<{ title?: string }>) {
  const Pre = useMDXComponents().pre as React.ComponentType<
    Record<string, unknown>
  >
  return (
    <Pre className="shiki" title={title}>
      <code className="language-console">
        <span className="line" data-cmd="">
          <span>❯ jj status</span>
        </span>
        {"\n"}
        <span className="line">
          <span>The working copy has no changes.</span>
        </span>
        {"\n"}
        <span className="line" data-cmd="">
          <span>❯ jj log</span>
        </span>
        {"\n"}
        <span className="line">
          <span>@ tturtmot 4bb47a91</span>
        </span>
      </code>
    </Pre>
  )
}

describe("console fence as a terminal window", () => {
  test("gets the window, not the code panel, and counts its lines", () => {
    const { container } = render(<Host />)
    expect(container.querySelector(".pp-term")).not.toBeNull()
    expect(container.querySelector(".pp-code")).toBeNull()
    expect(container.querySelector(".pp-term-name")?.textContent).toBe(
      "terminal",
    )
    expect(container.querySelectorAll(".pp-term-sig > span")).toHaveLength(3)
    const foot = container.querySelector(".pp-term-foot")?.textContent
    expect(foot).toContain("2 commands")
    expect(foot).toContain("4 lines")
  })

  test("a fence title names the window", () => {
    const { container } = render(<Host title="devbox" />)
    expect(container.querySelector(".pp-term-name")?.textContent).toBe("devbox")
  })
})
