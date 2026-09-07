const FULL_WIDTH = /[ᄀ-ᅟ⺀-〾ぁ-㏿㐀-䶿一-鿿ꀀ-꓏가-힣豈-﫿︰-﹯＀-｠￠-￦]/
const LATIN_EM = 0.67
const FULL_WIDTH_EM = 1.0
const SPACE_EM = 0.3
const LETTER_SPACING_EM = 0.04
const SAFETY_FACTOR = 1.02

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

export function estimateLongestWordEm(text: string): number {
  let widest = 0
  for (const word of text.split(" ")) {
    widest = Math.max(widest, estimateHeadlineEm(word))
  }
  return widest
}
