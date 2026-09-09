import { describe, expect, test } from "bun:test"

const FONTS = await Bun.file("lib/fonts.ts").text()
const CSS = await Bun.file("app/globals.css").text()
const SOURCES = await Promise.all(
  [
    ...new Bun.Glob("{app,components}/**/*.{ts,tsx,css}").scanSync("."),
    "mdx-components.tsx",
  ].map((path) => Bun.file(path).text()),
)

const UTILITY_WEIGHTS: Record<string, number> = {
  black: 900,
  bold: 700,
  extrabold: 800,
  extralight: 200,
  light: 300,
  medium: 500,
  normal: 400,
  semibold: 600,
  thin: 100,
}

function declaredVariables(): string[] {
  return [...FONTS.matchAll(/variable:\s*"(--font-[\w-]+)"/g)].map((m) => m[1])
}

function declaredWeights(): number[] {
  return [...FONTS.matchAll(/weight:\s*\[([^\]]+)\]/g)].flatMap((m) =>
    [...m[1].matchAll(/"(\d+)"/g)].map((w) => Number(w[1])),
  )
}

function requestedWeights(): Set<number> {
  const weights = new Set<number>([400])
  for (const source of SOURCES) {
    for (const m of source.matchAll(/font-weight:\s*(\d+)/g)) {
      weights.add(Number(m[1]))
    }
    for (const m of source.matchAll(
      /font-(thin|extralight|light|normal|medium|semibold|bold|extrabold|black)\b/g,
    )) {
      const weight = UTILITY_WEIGHTS[m[1] ?? ""]
      if (weight) {
        weights.add(weight)
      }
    }
  }
  return weights
}

/**
 * Google splits a Japanese family across ~120 unicode ranges, so one weight of
 * Noto Sans JP is ~120 `@font-face` rules and ~94KB of CSS. With `inlineCss`
 * on, that CSS is written into every page and repeated in the flight payload:
 * eight Japanese weights put every page of the site at 2.6MB, 871KB gzipped,
 * of which the site's own CSS was 78KB.
 *
 * Nothing about the page looks wrong when a weight is added — it renders, and
 * it costs 94KB on every request — so the guard has to be structural.
 */
describe("font declarations", () => {
  // Family-agnostic: it catches a weight nothing anywhere asks for, not a
  // weight that only another family's elements ask for.
  test("no weight is declared that no style asks for", () => {
    const requested = requestedWeights()
    const unused = [...new Set(declaredWeights())].filter(
      (weight) => !requested.has(weight),
    )

    expect(unused).toEqual([])
  })

  // A `var()` with no fallback and no definition makes the whole
  // `font-family` invalid at computed-value time, so the element silently
  // inherits instead of falling back — which is what removing a loader from
  // `lib/fonts.ts` while `globals.css` still names it would do.
  test("every font variable the stylesheet reads is loaded", () => {
    const declared = declaredVariables()
    const read = [
      ...new Set(
        [...CSS.matchAll(/var\((--font-[\w-]+-loaded)\)/g)].map((m) => m[1]),
      ),
    ]

    expect(read.length).toBeGreaterThan(0)
    for (const variable of read) {
      expect(declared).toContain(variable)
    }
  })
})
