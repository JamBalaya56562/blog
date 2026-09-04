/**
 * Horizontal scrolling ticker beneath the header — an electric signboard:
 * the text stream never stops and never visibly restarts.
 *
 * Items are pre-collected on the server so the marquee shows real data
 * (latest title, post count, top tags, ...).
 *
 * Seamless loop: the track holds two identical groups and slides by exactly
 * one group width (-50% of the track), so the moment it snaps back, group 2
 * is sitting where group 1 was — the seam is invisible. That only works if
 * the track is as wide as its content, hence `width: max-content` on
 * `.pp-marquee-track` (a plain flex container would stay at the parent's
 * width and -50% would be the wrong distance).
 */

/** Widest viewport we pad the group out for, so a short item list still
 *  covers the screen and never opens a gap mid-scroll. Sized past a 2560px
 *  display. */
const MIN_GROUP_WIDTH_PX = 2700
/** Matches `gap` / `padding-right` on `.pp-marquee-group` in globals.css. */
const GAP_PX = 60
/** `◢` plus its right margin, at the ticker's 10px type. */
const MARKER_PX = 22
/** Scroll speed. Deriving the duration from the measured group width keeps
 *  this constant, so the stream reads at the same pace whether the latest
 *  post title is short or long — a fixed duration would speed up as the
 *  content grew. */
const SCROLL_PX_PER_SEC = 70

/**
 * Rough rendered width of one item at 10px mono with 0.2em tracking: a
 * 0.6em advance plus 2px of tracking per glyph, and CJK is full-width.
 * Deliberately on the low side — under-estimating only adds a repetition,
 * while over-estimating could leave the group narrower than the screen and
 * open a visible gap.
 */
const ASCII_CHAR_PX = 8
const CJK_CHAR_PX = 12

function estimateItemWidth(label: string): number {
  let width = MARKER_PX + GAP_PX
  for (const ch of label) {
    width += ch.charCodeAt(0) > 0x2e7f ? CJK_CHAR_PX : ASCII_CHAR_PX
  }
  return width
}

export function MarqueeTicker({
  items,
}: {
  readonly items: readonly string[]
}) {
  if (items.length === 0) {
    return null
  }

  const listWidth = items.reduce((sum, l) => sum + estimateItemWidth(l), 0)
  const repeat = Math.max(1, Math.ceil(MIN_GROUP_WIDTH_PX / listWidth))
  const group = Array.from({ length: repeat }, () => items).flat()
  const duration = Math.round((listWidth * repeat) / SCROLL_PX_PER_SEC)

  return (
    <div
      aria-hidden
      className="pp-marquee overflow-hidden border-y border-cyber-line bg-cyber-bg-1/40 py-1"
    >
      <div
        className="pp-marquee-track text-[10px] uppercase tracking-[0.2em] text-cyber-dim"
        style={
          { "--pp-marquee-duration": `${duration}s` } as React.CSSProperties
        }
      >
        {/* Two identical groups — see the seamless-loop note above. */}
        {[0, 1].map((copy) => (
          <div key={copy} className="pp-marquee-group">
            {group.map((label, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: fixed-order repeated list
              <span key={i} className="font-mono">
                <span className="mr-2 text-cyber-cyan">◢</span>
                {label}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
