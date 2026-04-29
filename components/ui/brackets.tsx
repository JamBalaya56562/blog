type BracketsColor = "cyan" | "amber" | "magenta"

/**
 * Renders 4 corner brackets inside a relatively-positioned parent.
 * Mirrors the PSYCHO-PASS HUD brackets in the mock.
 */
export function Brackets({
  color = "cyan",
}: {
  readonly color?: BracketsColor
}) {
  return (
    <span aria-hidden className="pp-brackets" data-color={color}>
      <span className="pp-bracket pp-bracket-tl" />
      <span className="pp-bracket pp-bracket-tr" />
      <span className="pp-bracket pp-bracket-bl" />
      <span className="pp-bracket pp-bracket-br" />
    </span>
  )
}
