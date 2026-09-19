import type { Dictionary } from "@/lib/i18n/get-dictionary"

/**
 * The readout beside the sort control on the blog index: how many posts the
 * current result holds, and how many tags there are. Drawn like the sort
 * control — the same border, mono, uppercase — so the row reads as one strip
 * of controls and readouts and the index needs no extra line for the
 * numbers. The padding is a step tighter than the sort buttons used to
 * have, so that the two boxes share one row at 375px in English too.
 */
export function IndexCounts({
  posts,
  tags,
  dictionary,
}: {
  readonly posts: number
  readonly tags: number
  readonly dictionary: Dictionary["blog"]
}) {
  return (
    <div
      className="flex border border-cyber-line font-mono text-[10px] uppercase tracking-[0.18em] text-cyber-dim"
      data-testid="index-counts"
    >
      <Cell
        count={posts}
        label={posts === 1 ? dictionary.countPostOne : dictionary.countPosts}
      />
      <Cell
        count={tags}
        label={tags === 1 ? dictionary.countTagOne : dictionary.countTags}
        className="border-l border-cyber-line"
      />
    </div>
  )
}

function Cell({
  count,
  label,
  className = "",
}: {
  readonly count: number
  readonly label: string
  readonly className?: string
}) {
  return (
    <span className={`px-3 py-2 ${className}`}>
      <span className="text-cyber-cyan">{count}</span> {label}
    </span>
  )
}
