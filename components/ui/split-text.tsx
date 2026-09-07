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
                    "--pp-split-delay": `${delay + (charIndex + i) * stagger}ms`,
                  } as React.CSSProperties
                }
              >
                {c}
              </span>
            ))}
          </span>
        )
        charIndex += chars.length + 1
        return wordIndex === words.length - 1 ? rendered : [rendered, " "]
      })}
    </span>
  )
}
