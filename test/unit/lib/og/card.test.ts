import { describe, expect, test } from "bun:test"
import { locales } from "@/lib/i18n/config"
import { getDictionary } from "@/lib/i18n/get-dictionary"
import {
  OG_CONTENT_TYPE,
  OG_SIZE,
  ogEyebrow,
  titleFontSize,
} from "@/lib/og/card"
import { SITE_URL } from "@/lib/site"

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

/**
 * The eyebrow is the site's name printed inside the image itself. It defaulted
 * to `"JAM'S BLOG"` and no caller ever overrode it, so every Japanese card
 * shipped with an English name burned into the PNG. Nothing caught it: a
 * default is never a missing value, and the text lives in an image no test
 * was reading.
 */
describe("ogEyebrow", () => {
  test("lifts the Latin part of a name to caps", () => {
    expect(ogEyebrow("Jam's Blog")).toBe("JAM'S BLOG")
  })

  // Japanese has no case, so the kana come through untouched. What matters is
  // that the name is the Japanese one at all.
  test("carries a Japanese name through rather than replacing it", () => {
    expect(ogEyebrow("Jamのブログ")).toBe("JAMのブログ")
  })

  test("every locale's card names the site in that locale", () => {
    const seen = locales.map((locale) =>
      ogEyebrow(getDictionary(locale).header.siteName),
    )
    expect(new Set(seen).size).toBe(locales.length)
    expect(seen).toContain("JAMのブログ")
  })
})

/**
 * The card printed the domain as a string literal while `lib/site.ts` held the
 * canonical URL. Two copies of one fact, and the one inside the image is the
 * copy nobody would check after a rename.
 */
describe("the card's domain line", () => {
  test("is not a second copy of the domain", async () => {
    const source = await Bun.file("lib/og/card.tsx").text()
    expect(source).not.toContain(SITE_URL.host)
    expect(source).toContain("SITE_URL.host")
  })
})
