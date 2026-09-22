"use client"

import { useReducer } from "react"
import {
  type BuildContextAction,
  type BuildContextContent,
  type BuildContextState,
  derive,
  initialState,
  isInitial,
  reduce,
} from "@/lib/explorables/build-context"
import { fill } from "@/lib/explorables/format"
import { Explorable } from "./explorable"

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
          {view.rows.map((row) => (
            <li
              className="pp-explorable-row"
              data-line-state={row.excludedBy === null ? "ran" : "skipped"}
              key={row.name}
            >
              <span className="pp-explorable-cmdtext">{row.name}</span>
              <span className="pp-explorable-badge">
                {row.excludedBy === null
                  ? content.labels.sentState
                  : fill(content.labels.excludedState, {
                      pattern: row.excludedBy,
                    })}
              </span>
              {row.note && (
                <span className="pp-explorable-note">{row.note}</span>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div className="pp-explorable-release">
        <p className="pp-explorable-column-head">{content.labels.sent}</p>
        <p className="pp-explorable-outcome">
          {view.rows
            .filter((row) => row.excludedBy === null)
            .map((row) => row.name)
            .join("  ") || "—"}
        </p>
      </div>
    </Explorable>
  )
}
