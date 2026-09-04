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
  const chars = Array.from(text)
  const variant = animation === "glitch" ? "pp-split-glitch" : "pp-split-rise"

  return (
    <span className={className} style={{ display: "inline-block" }}>
      {chars.map((c, i) => (
        <span
          // biome-ignore lint/suspicious/noArrayIndexKey: char position is the natural key
          key={i}
          className={`pp-split-char ${variant}`}
          style={
            {
              "--pp-split-delay": `${delay + i * stagger}ms`,
            } as React.CSSProperties
          }
        >
          {c}
        </span>
      ))}
    </span>
  )
}
