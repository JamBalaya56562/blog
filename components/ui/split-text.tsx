/**
 * Splits text into spans by character with a staggered rise/glitch animation.
 * Pure CSS animation — no JS state, so it can render server-side.
 *
 * The animation lives in `.pp-split-char` (globals.css) rather than in an
 * inline style: an inline `animation` outranks every stylesheet rule that
 * lacks `!important`, so the `prefers-reduced-motion` block could never
 * switch it off. Only the per-character delay is passed inline, as a custom
 * property the class reads.
 *
 * NOTE: each character animation is `forwards`, so the final state is visible
 * even when JS is disabled.
 */
export function SplitText({
  text,
  delay = 0,
  stagger = 25,
  animation = "rise",
  className,
}: {
  readonly text: string
  readonly delay?: number
  readonly stagger?: number
  readonly animation?: "rise" | "glitch"
  readonly className?: string
}) {
  const variant = animation === "glitch" ? "pp-split-glitch" : "pp-split-rise"

  // Characters are grouped into words. Each character is its own inline-block,
  // and CSS opens a wrap opportunity around every one of those, so a line free
  // to wrap used to break in the middle of a word. An inline-block word is
  // atomic, which leaves the spaces between words as the only places a line
  // can break.
  const words = text.split(" ")
  let charIndex = 0

  return (
    <span className={className} style={{ display: "inline-block" }}>
      {words.map((word, wordIndex) => {
        const chars = Array.from(word)
        const rendered = (
          <span
            // biome-ignore lint/suspicious/noArrayIndexKey: word position is the natural key
            key={wordIndex}
            className="pp-split-word"
          >
            {chars.map((c, i) => (
              <span
                // biome-ignore lint/suspicious/noArrayIndexKey: char position is the natural key
                key={i}
                className={`pp-split-char ${variant}`}
                style={
                  {
                    // Counted across the whole line, not restarted per word,
                    // so the stagger still sweeps left to right.
                    "--pp-split-delay": `${delay + (charIndex + i) * stagger}ms`,
                  } as React.CSSProperties
                }
              >
                {c}
              </span>
            ))}
          </span>
        )
        // The space consumed by the split still costs a stagger step, so the
        // rhythm matches what a single run of characters would produce.
        charIndex += chars.length + 1
        return wordIndex === words.length - 1 ? rendered : [rendered, " "]
      })}
    </span>
  )
}
