/**
 * Splits text into spans by character with a staggered rise/glitch animation.
 * Pure CSS animation — no JS state, so it can render server-side.
 *
 * NOTE: each character animation is `forwards`, so the final state is visible
 * even when JS is disabled. Honors `prefers-reduced-motion` via globals.css.
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
  const keyframe = animation === "rise" ? "splitRise" : "splitGlitch"

  return (
    <span className={className} style={{ display: "inline-block" }}>
      {chars.map((c, i) => (
        <span
          // biome-ignore lint/suspicious/noArrayIndexKey: char position is the natural key
          key={i}
          style={{
            display: "inline-block",
            opacity: 0,
            animation: `${keyframe} 0.55s cubic-bezier(.2,.7,.3,1) forwards`,
            animationDelay: `${delay + i * stagger}ms`,
            whiteSpace: c === " " ? "pre" : "normal",
          }}
        >
          {c}
        </span>
      ))}
    </span>
  )
}
