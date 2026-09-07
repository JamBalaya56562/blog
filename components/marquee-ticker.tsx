const MIN_GROUP_WIDTH_PX = 2700
const GAP_PX = 60
const MARKER_PX = 22
const SCROLL_PX_PER_SEC = 35
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
