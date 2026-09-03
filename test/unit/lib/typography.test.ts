import { describe, expect, test } from "bun:test"
import { estimateHeadlineEm } from "@/lib/typography"

/**
 * Reference widths measured from the rendered hero headline at 96px
 * (see the calibration note in `lib/typography.ts`). The estimate must sit
 * above each of these: a low estimate produces a font-size that overflows the
 * container and wraps the line, which is exactly what `.pp-hero-line` exists
 * to prevent.
 */
const MEASURED_EM = {
  "Making programming": 12.252,
  "more accessible.": 10.141,
  "もっと身近に。": 7.28,
  プログラミングを: 8.32,
} as const

describe("estimateHeadlineEm", () => {
  test("returns 0 for an empty string", () => {
    expect(estimateHeadlineEm("")).toBe(0)
  })

  test("never under-estimates the real headline strings", () => {
    for (const [text, measured] of Object.entries(MEASURED_EM)) {
      expect(estimateHeadlineEm(text)).toBeGreaterThanOrEqual(measured)
    }
  })

  /**
   * The hero takes the wider of its two lines and sizes both from it, so the
   * accuracy that matters is on that maximum — a loose estimate there would
   * shrink the whole headline for no reason.
   */
  test("stays within 5% of the real width on the line that governs the size", () => {
    const headlines = [
      ["Making programming", "more accessible."],
      ["プログラミングを", "もっと身近に。"],
    ] as const

    for (const lines of headlines) {
      const estimated = Math.max(...lines.map(estimateHeadlineEm))
      const measured = Math.max(...lines.map((line) => MEASURED_EM[line]))
      expect(estimated).toBeLessThan(measured * 1.05)
    }
  })

  test("grows monotonically as characters are appended", () => {
    const text = "Making programming"
    for (let i = 1; i < text.length; i++) {
      expect(estimateHeadlineEm(text.slice(0, i + 1))).toBeGreaterThan(
        estimateHeadlineEm(text.slice(0, i)),
      )
    }
  })

  test("counts a full-width glyph as wider than a latin one", () => {
    expect(estimateHeadlineEm("あ")).toBeGreaterThan(estimateHeadlineEm("a"))
  })

  test("counts a space as narrower than a latin glyph", () => {
    expect(estimateHeadlineEm(" ")).toBeLessThan(estimateHeadlineEm("a"))
  })

  test("handles astral-plane characters as single glyphs", () => {
    expect(estimateHeadlineEm("𝒜")).toBe(estimateHeadlineEm("a"))
  })
})
