"use client"

import type { GraphRowView, RowKind } from "@/lib/explorables/graph"

/** Where a lane's node sits across the row. */
const LANE_X = [12, 28] as const
/** A graph with one lane is 24 wide; the second lane needs the rest. */
const WIDTH = [24, 40] as const

/** The node itself: `@`, `○` or `◆` as `jj log` prints them. */
function GraphNode({ kind, x }: Readonly<{ kind: RowKind; x: number }>) {
  if (kind === "immutable") {
    return (
      <path
        d={`M${x} 12 L${x + 6} 18 L${x} 24 L${x - 6} 18 Z`}
        fill="currentColor"
      />
    )
  }
  if (kind === "at") {
    return (
      <>
        <circle cx={x} cy="18" fill="currentColor" r="4" />
        <circle
          cx={x}
          cy="18"
          fill="none"
          r="7"
          stroke="currentColor"
          strokeWidth="1.5"
        />
      </>
    )
  }
  return (
    <circle
      cx={x}
      cy="18"
      fill="none"
      r="5"
      stroke="currentColor"
      strokeWidth="1.5"
    />
  )
}

/**
 * The lines into and out of one node.
 *
 * The trunk is drawn a row at a time: a row on it joins upwards to the row
 * above and downwards to the row below, and a row off to the side lets the
 * trunk run past behind it, which is the `│` beside a forked commit. A side
 * row that rejoins bends back into the trunk, as `├─╯` does.
 */
function GraphLines({
  lane,
  first,
  last,
  rejoins,
}: Readonly<{
  lane: 0 | 1
  first: boolean
  last: boolean
  rejoins: boolean
}>) {
  const x = LANE_X[lane]
  const onTrunk = lane === 0
  const above = onTrunk && !first
  const below = onTrunk && !last
  const passes = lane === 1

  return (
    <>
      {(above || below || passes) && (
        <line
          stroke="currentColor"
          strokeWidth="1.5"
          x1={LANE_X[0]}
          x2={LANE_X[0]}
          y1={above || passes ? 0 : 18}
          y2={below || passes ? 36 : 18}
        />
      )}
      {lane === 1 &&
        !last &&
        (rejoins ? (
          <path
            d={`M${x} 18 L${x} 26 Q${x} 36 ${LANE_X[0]} 36`}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          />
        ) : (
          <line
            stroke="currentColor"
            strokeWidth="1.5"
            x1={x}
            x2={x}
            y1="18"
            y2="36"
          />
        ))}
    </>
  )
}

/** One commit: its node, what it says, and the names pointing at it. */
function GraphRow({
  row,
  first,
  last,
  forked,
}: Readonly<{
  row: GraphRowView
  first: boolean
  last: boolean
  forked: boolean
}>) {
  const lane = row.lane ?? 0

  return (
    <li className="pp-explorable-graph-row" data-mark={row.mark}>
      <span className="pp-explorable-glyph" data-kind={row.kind}>
        <svg
          aria-hidden="true"
          focusable="false"
          viewBox={`0 0 ${WIDTH[forked ? 1 : 0]} 36`}
        >
          <GraphLines
            first={first}
            lane={lane}
            last={last}
            rejoins={row.rejoins === true}
          />
          <GraphNode kind={row.kind} x={LANE_X[lane]} />
        </svg>
      </span>
      <span className="pp-explorable-graph-desc">
        {row.desc}
        {/* The accent says which row changed; this says it in words, for a
            reader who does not get the colour. */}
        {row.markLabel && <span className="sr-only">{row.markLabel}</span>}
        {row.commitId && (
          <span className="pp-explorable-commitid">{row.commitId}</span>
        )}
        {row.note && (
          <span className="pp-explorable-graph-note">{row.note}</span>
        )}
      </span>
      <span className="pp-explorable-refs">
        {row.refs.map((ref) => (
          <span
            className="pp-explorable-ref"
            data-ref={ref.kind}
            key={ref.label}
          >
            {ref.label}
          </span>
        ))}
      </span>
    </li>
  )
}

/**
 * One column of a commit graph: a node per commit, newest at the top, with
 * the names that point at it.
 *
 * The node and the lines around it are one small SVG per row, drawn in
 * `currentColor` so the colour comes from the class on the row rather than
 * from the markup. Everything with words in it — the description, the chips
 * — is HTML, because a post in Japanese needs the line-breaking rules that
 * `.prose-cyber` sets and SVG text would take none of them.
 *
 * A row on lane 1 sits in the second column, the way `jj log` draws a change
 * whose trunk has moved past it; the column is only that wide when some row
 * is actually there.
 */
export function GraphRows({
  rows,
  label,
}: Readonly<{ rows: readonly GraphRowView[]; label: string }>) {
  const forked = rows.some((row) => row.lane === 1)

  return (
    <ol
      aria-label={label}
      className="pp-explorable-graph"
      data-forked={forked}
      // Redundant to the spec, not to Safari: `list-style: none` takes the
      // list semantics away there, and the name on this element is only
      // useful with them.
      // biome-ignore lint/a11y/noRedundantRoles: see the comment above
      role="list"
    >
      {rows.map((row, index) => (
        <GraphRow
          first={index === 0}
          forked={forked}
          key={row.key}
          last={index === rows.length - 1}
          row={row}
        />
      ))}
    </ol>
  )
}
