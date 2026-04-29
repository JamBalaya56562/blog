/**
 * Horizontal scrolling ticker beneath the header.
 * Items are pre-collected on the server so the marquee shows real data
 * (latest title, post count, top tags, ...).
 */
export function MarqueeTicker({
  items,
}: {
  readonly items: readonly string[]
}) {
  if (items.length === 0) {
    return null
  }
  // Repeat once for seamless loop (track translates -50%).
  const doubled = [...items, ...items]
  return (
    <div
      aria-hidden
      className="overflow-hidden border-y border-cyber-line bg-cyber-bg-1/40 py-1"
    >
      <div className="pp-marquee-track text-[10px] uppercase tracking-[0.2em] text-cyber-dim">
        {doubled.map((label, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: doubled list has stable order
          <span key={i} className="font-mono">
            <span className="mr-2 text-cyber-cyan">◢</span>
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}
