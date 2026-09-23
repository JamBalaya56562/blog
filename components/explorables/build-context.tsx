"use client"

import { useReducer } from "react"
import {
  type BuildContextAction,
  type BuildContextContent,
  type BuildContextState,
  derive,
  excludes,
  initialState,
  isInitial,
  reduce,
} from "@/lib/explorables/build-context"
import { fill } from "@/lib/explorables/format"
import { Explorable } from "./explorable"
import { Frame } from "./frame"

type Props = BuildContextContent &
  Readonly<{
    title: string
    hint?: string
    caption?: string
  }>

/**
 * The directory on one side, `.dockerignore` on the other, and what is left
 * to be sent to the engine.
 *
 * Turning a line off puts what it was keeping out back on the wire, which is
 * the article's point from the other direction: the engine is in a VM, so
 * "sending the directory" is a transfer, and `COPY` can only reach what
 * arrived.
 *
 * Authored in MDX with the repository's own `.dockerignore` lines:
 *
 *     <BuildContext
 *       title="docker build ."
 *       entries={[{ name: "Dockerfile" }, { name: "node_modules", note: "…" }]}
 *       ignore={["node_modules", ".git"]}
 *       labels={{ directory: "…", ignore: "…", sent: "…", sentState: "…", excludedState: "kept out by {pattern}" }}
 *       status="{sent} of {total}"
 *     />
 *
 * The matcher handles a plain name, with or without a globstar prefix, which
 * is what these lines are; it is not the whole of the format.
 */
export function BuildContext({ title, hint, caption, ...content }: Props) {
  const [state, dispatch] = useReducer(
    (current: BuildContextState, action: BuildContextAction) =>
      reduce(current, action, content),
    content,
    initialState,
  )
  const view = derive(state, content)

  return (
    <Explorable
      caption={caption}
      hint={hint}
      onReset={() => dispatch({ type: "reset" })}
      pristine={isInitial(state, content)}
      status={fill(content.status, {
        sent: view.sent,
        total: view.total,
      })}
      statuses={Array.from({ length: view.total + 1 }, (_, sent) =>
        fill(content.status, { sent, total: view.total }),
      )}
      title={title}
    >
      <div>
        <p className="pp-explorable-column-head">{content.labels.ignore}</p>
        <div className="pp-explorable-controls">
          {content.ignore.map((pattern) => (
            <button
              aria-pressed={state.active.includes(pattern)}
              className="pp-explorable-cmd"
              key={pattern}
              onClick={() => dispatch({ pattern, type: "toggle" })}
              type="button"
            >
              {pattern}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="pp-explorable-column-head">{content.labels.directory}</p>
        <ul className="pp-explorable-lines">
          {view.rows.map((row) => {
            // What this row's badge can say: that it was sent, or the name
            // of one of the lines that can actually keep it out. Laying
            // those readings into the badge's own cell makes the cell as
            // tall as its longest one, so a row never gains a line while
            // the reader is looking at it.
            const said =
              row.excludedBy === null
                ? content.labels.sentState
                : fill(content.labels.excludedState, {
                    pattern: row.excludedBy,
                  })
            const readings = [
              content.labels.sentState,
              ...content.ignore
                .filter((pattern) => excludes(pattern, row.name))
                .map((pattern) =>
                  fill(content.labels.excludedState, { pattern }),
                ),
            ]
            return (
              <li
                className="pp-explorable-row"
                data-line-state={row.excludedBy === null ? "ran" : "skipped"}
                key={row.name}
              >
                <span className="pp-explorable-cmdtext">{row.name}</span>
                <Frame
                  active={0}
                  panes={[
                    said,
                    ...readings.filter((reading) => reading !== said),
                  ].map((reading) => (
                    <span className="pp-explorable-badge" key={reading}>
                      {reading}
                    </span>
                  ))}
                />
                {row.note && (
                  <span className="pp-explorable-note">{row.note}</span>
                )}
              </li>
            )
          })}
        </ul>
      </div>

      {/* The line of what reaches the engine is longest when nothing is
          kept out, so that is the room it takes from the start. */}
      <Frame
        active={0}
        panes={[
          view.rows.filter((row) => row.excludedBy === null),
          view.rows,
        ].map((rows, index) => (
          <div
            className="pp-explorable-release"
            // The live line, then the whole directory behind it.
            // biome-ignore lint/suspicious/noArrayIndexKey: two fixed panels
            key={index}
          >
            <p className="pp-explorable-column-head">{content.labels.sent}</p>
            <p className="pp-explorable-outcome">
              {rows.map((row) => row.name).join("  ") || "—"}
            </p>
          </div>
        ))}
      />
    </Explorable>
  )
}
