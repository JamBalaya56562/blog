import { describe, expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import { THEME_BACKGROUND } from "@/lib/theme/colors"

const CSS = readFileSync(
  new URL("../../../../app/globals.css", import.meta.url),
  "utf8",
)

/**
 * `theme_color` in the manifest and the `<meta name="theme-color">` tags need
 * literal colours, so these values are copied out of the stylesheet by hand.
 * That copy is the whole risk: change `--background` in `globals.css` and the
 * PWA splash and browser chrome keep the old colour with nothing to say so.
 */
function backgroundFor(selector: string): string {
  const block = CSS.slice(CSS.indexOf(`${selector} {`))
  const match = block
    .slice(0, block.indexOf("}"))
    .match(/--background:\s*([^;]+);/)
  if (!match) {
    throw new Error(`no --background under ${selector}`)
  }
  return match[1].trim()
}

describe("THEME_BACKGROUND", () => {
  test("light matches :root in globals.css", () => {
    expect(THEME_BACKGROUND.light).toBe(backgroundFor(":root"))
  })

  test("dark matches .dark in globals.css", () => {
    expect(THEME_BACKGROUND.dark).toBe(backgroundFor(".dark"))
  })

  // A white splash on a near-black site was the bug this fixes; the two
  // themes disagreeing is the point of having both.
  test("the two themes are actually different colours", () => {
    expect(THEME_BACKGROUND.light).not.toBe(THEME_BACKGROUND.dark)
  })
})
