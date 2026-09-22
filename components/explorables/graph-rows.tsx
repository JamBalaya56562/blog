"use client"

import type { GraphRowView } from "@/lib/explorables/graph"

/** Where a lane's node sits across the row. */
const LANE_X = [12, 28] as const
/** A graph with one lane is 24 wide; the second lane needs the rest. */
const WIDTH = [24, 40] as const

/**
 * One column of a commit graph: a node per commit, newest at the top, with
 * the names that point at it.
 *
 * The node and the line down to its parent are one small SVG per row, drawn
 * in `currentColor` so the colour comes from the class on the row rather
 * than from the markup. Everything with words in it — the description, the
 * chips — is HTML, because a post in Japanese needs the line-breaking rules
 * that `.prose-cyber` sets and SVG text would take none of them.
 *
 * The glyphs are the ones `jj log` prints: `@` for the working copy, `○` for
 * a commit that can still be rewritten, `◆` for one the remote has. A row on
 * lane 1 sits in the second column, the way `jj log` draws a change whose
 * trunk has moved past it, and `rejoins` bends its line back into the trunk
 * as `├─╯` does.
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
      {rows.map((row, index) => {
        const lane = row.lane ?? 0
        const x = LANE_X[lane]
        const below = rows[index + 1]
        // The trunk is one line drawn a row at a time. A row on it joins
        // upwards to the row above and downwards to the row below; a row
        // off to the side lets the trunk run past behind it, which is the
        // `│` beside a forked commit in `jj log`.
        const trunkAbove = lane === 0 && index > 0
        const trunkBelow = lane === 0 && below !== undefined
        const trunkPasses = lane === 1

        return (
          <li
            className="pp-explorable-graph-row"
            data-mark={row.mark}
            key={row.key}
          >
            <span className="pp-explorable-glyph" data-kind={row.kind}>
              <svg
                aria-hidden="true"
                focusable="false"
                viewBox={`0 0 ${WIDTH[forked ? 1 : 0]} 36`}
              >
                {(trunkAbove || trunkBelow || trunkPasses) && (
                  <line
                    stroke="currentColor"
                    strokeWidth="1.5"
                    x1={LANE_X[0]}
                    x2={LANE_X[0]}
                    y1={trunkAbove || trunkPasses ? 0 : 18}
                    y2={trunkBelow || trunkPasses ? 36 : 18}
                  />
                )}
                {row.rejoins && below !== undefined ? (
                  // The side lane bends back into the trunk, as `├─╯` does.
                  <path
                    d={`M${x} 18 L${x} 26 Q${x} 36 ${LANE_X[0]} 36`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                ) : (
                  lane === 1 &&
                  below !== undefined && (
                    <line
                      stroke="currentColor"
                      strokeWidth="1.5"
                      x1={x}
                      x2={x}
                      y1="18"
                      y2="36"
                    />
                  )
                )}
                {row.kind === "immutable" ? (
                  <path
                    d={`M${x} 12 L${x + 6} 18 L${x} 24 L${x - 6} 18 Z`}
                    fill="currentColor"
                  />
                ) : row.kind === "at" ? (
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
                ) : (
                  <circle
                    cx={x}
                    cy="18"
                    fill="none"
                    r="5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                )}
              </svg>
            </span>
            <span className="pp-explorable-graph-desc">
              {row.desc}
              {/* The accent says which row changed; this says it in words,
                  for a reader who does not get the colour. */}
              {row.markLabel && (
                <span className="sr-only">{row.markLabel}</span>
              )}
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
      })}
    </ol>
  )
}
