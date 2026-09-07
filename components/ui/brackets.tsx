type BracketsColor = "cyan" | "amber" | "magenta"

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
