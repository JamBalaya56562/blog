import { describe, expect, test } from "bun:test"
import { render } from "@testing-library/react"
import { ThemeInitScript } from "@/components/theme-init-script"

describe("ThemeInitScript", () => {
  test("outputs a <script> tag", () => {
    const { container } = render(<ThemeInitScript />)
    const script = container.querySelector("script")
    expect(script).not.toBeNull()
  })

  test("script contains theme initialization logic", () => {
    const { container } = render(<ThemeInitScript />)
    const script = container.querySelector("script")
    expect(script?.innerHTML).toContain("localStorage")
    expect(script?.innerHTML).toContain("prefers-color-scheme")
    expect(script?.innerHTML).toContain("dark")
  })
})
