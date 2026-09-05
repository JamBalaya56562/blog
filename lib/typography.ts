/**
 * Width estimation for single-line display headlines.
 *
 * The hero headline must never wrap, so its font-size is derived from the
 * container width divided by the string's width in `em`
 * (see `.pp-hero-line` in `app/globals.css`). Measuring the real text would
 * need client-side JS; the headline is deliberately server-rendered with a
 * pure-CSS animation, so we estimate from the character mix instead and lean
 * slightly wide so the result always fits.
 */

/** Full-width / CJK ranges. Those glyphs advance ~1em regardless of face. */
const FULL_WIDTH = /[ᄀ-ᅟ⺀-〾ぁ-㏿㐀-䶿一-鿿ꀀ-꓏가-힣豈-﫿︰-﹯＀-｠￠-￦]/

/**
 * Advance widths in em for the headline stack (`--blog-font-headline`:
 * Orbitron, falling through to Noto Sans JP for Japanese glyphs).
 *
 * Calibrated by measuring the rendered headline at 96px, letter-spacing
 * excluded:
 *
 *   "Making programming"  12.252em → 0.661em per latin glyph
 *   "more accessible."    10.141em → 0.613em per latin glyph
 *   "プログラミングを"      8.320em → 1.000em per full-width glyph
 *   "もっと身近に。"        7.280em → 1.000em per full-width glyph
 *
 * Full-width glyphs are exactly 1em. Latin advances vary with the glyph mix
 * (Orbitron is a wide geometric face, and `m`/`M` run far above the mean), so
 * the latin figure sits above the widest string observed rather than at its
 * average — under-estimating would let the line overflow.
 */
const LATIN_EM = 0.67
const FULL_WIDTH_EM = 1.0
const SPACE_EM = 0.3

/** `.pp-display` sets `letter-spacing: 0.04em`, applied after every glyph. */
const LETTER_SPACING_EM = 0.04

/**
 * Bias the estimate wide by 2%. Before the webfont loads the browser paints
 * with a fallback face whose metrics differ slightly, and overflowing is far
 * more visible than a headline rendered a hair small.
 */
const SAFETY_FACTOR = 1.02

/**
 * Approximate width, in em, of `text` rendered on a single line in the
 * headline font. Returns 0 for an empty string.
 */
export function estimateHeadlineEm(text: string): number {
  let em = 0
  for (const char of text) {
    if (char === " ") {
      em += SPACE_EM
    } else if (FULL_WIDTH.test(char)) {
      em += FULL_WIDTH_EM
    } else {
      em += LATIN_EM
    }
    em += LETTER_SPACING_EM
  }
  return em * SAFETY_FACTOR
}

/**
 * Approximate width, in em, of the widest single word in `text`.
 *
 * Narrow screens cannot hold the whole headline on one line at a size worth
 * looking at, so they wrap. The size that governs there is the one that keeps
 * the longest word whole: anything smaller and the word itself has to break,
 * which is what the splitter's per-character boxes were doing.
 *
 * Japanese has no spaces, so the whole line counts as one word. That is the
 * conservative answer and it happens to be the right one: the line ends up
 * sized to fit on its own, which is how it should read.
 */
export function estimateLongestWordEm(text: string): number {
  let widest = 0
  for (const word of text.split(" ")) {
    widest = Math.max(widest, estimateHeadlineEm(word))
  }
  return widest
}
