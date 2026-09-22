"use client"

import type { Row } from "@/lib/explorables/bookmark-graph"

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
 * a commit that can still be rewritten, `◆` for one the remote has.
 */
export function GraphRows({
  rows,
  label,
}: Readonly<{ rows: readonly Row[]; label: string }>) {
  return (
    <ol aria-label={label} className="pp-explorable-graph">
      {rows.map((row, index) => (
        <li className="pp-explorable-graph-row" key={row.index}>
          <span className="pp-explorable-glyph" data-kind={row.kind}>
            <svg aria-hidden="true" focusable="false" viewBox="0 0 24 36">
              <title>{row.kind}</title>
              {index < rows.length - 1 && (
                <line
                  stroke="currentColor"
                  strokeWidth="1.5"
                  x1="12"
                  x2="12"
                  y1="18"
                  y2="36"
                />
              )}
              {row.kind === "immutable" ? (
                <path d="M12 12 L18 18 L12 24 L6 18 Z" fill="currentColor" />
              ) : row.kind === "at" ? (
                <>
                  <circle cx="12" cy="18" fill="currentColor" r="4" />
                  <circle
                    cx="12"
                    cy="18"
                    fill="none"
                    r="7"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                </>
              ) : (
                <circle
                  cx="12"
                  cy="18"
                  fill="none"
                  r="5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
              )}
            </svg>
          </span>
          <span className="pp-explorable-graph-desc">{row.desc}</span>
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
      ))}
    </ol>
  )
}
