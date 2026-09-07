import { describe, expect, test } from "bun:test"
import { OG_CONTENT_TYPE, OG_SIZE, titleFontSize } from "@/lib/og/card"

describe("OG card constants", () => {
  // 1200x630 is what the crawlers crop to; anything else gets letterboxed.
  test("is the standard Open Graph size", () => {
    expect(OG_SIZE).toEqual({ height: 630, width: 1200 })
  })

  test("declares the type ImageResponse actually returns", () => {
    expect(OG_CONTENT_TYPE).toBe("image/png")
  })
})

describe("titleFontSize", () => {
  test("short titles get the largest size", () => {
    expect(titleFontSize("Blog")).toBe(76)
    expect(titleFontSize("自己紹介")).toBe(76)
  })

  test("it never exceeds the cap or falls below the floor", () => {
    expect(titleFontSize("")).toBeLessThanOrEqual(76)
    expect(titleFontSize("x".repeat(400))).toBeGreaterThanOrEqual(40)
    expect(titleFontSize("あ".repeat(400))).toBeGreaterThanOrEqual(40)
  })

  test("longer titles shrink", () => {
    const short = titleFontSize("Tailwind CSS v4 Guide")
    const long = titleFontSize(
      "A Deliberately Very Long English Post Title That Should Wrap Onto Multiple Lines",
    )
    expect(long).toBeLessThan(short)
  })

  // Sizing by `String.length` under-measured Japanese, because a full-width
  // character occupies about twice the advance of a Latin one. The estimator
  // in `lib/typography` already models that, so the two scripts have to agree
  // on width rather than on character count.
  test("full-width text is measured by width, not character count", () => {
    const latin = titleFontSize("a".repeat(40))
    const fullWidth = titleFontSize("あ".repeat(40))
    expect(fullWidth).toBeLessThan(latin)
  })

  test("it is monotonic — a longer title never renders larger", () => {
    const base = "プログラミングをもっと身近に。"
    let previous = titleFontSize(base)
    for (let i = 2; i <= 6; i++) {
      const size = titleFontSize(base.repeat(i))
      expect(size).toBeLessThanOrEqual(previous)
      previous = size
    }
  })
})
