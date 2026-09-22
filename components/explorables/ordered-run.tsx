"use client"

import { useReducer, useRef } from "react"
import { fill } from "@/lib/explorables/format"
import {
  derive,
  initialState,
  isInitial,
  type OrderedRunAction,
  type OrderedRunContent,
  type OrderedRunState,
  reduce,
} from "@/lib/explorables/ordered-run"
import { Explorable } from "./explorable"

type Props = OrderedRunContent &
  Readonly<{
    title: string
    hint?: string
    caption?: string
  }>

/**
 * A few lines of a file, in an order the reader can change, and what that
 * order does.
 *
 * Two of the mise sections come down to the same thing. In `[env]` the lines
 * are applied top to bottom and the last one to set a key wins; in a task's
 * `run` array the lines are run top to bottom and the first failure ends it.
 * Either way, moving a line moves the answer, which is the part the prose
 * has to ask the reader to take on trust.
 *
 * Authored in MDX with the rule named:
 *
 *     <OrderedRun
 *       title="mise.toml"
 *       rule="lastWins"
 *       lines={[
 *         { text: 'SHARED = "from-mise-toml"', value: "from-mise-toml" },
 *         { text: '_.file = ".env"', value: "from-dotenv" },
 *       ]}
 *       labels={{ lines: "…", outcome: "…", up: "Move up: {line}", down: "…", state: { wins: "…", … } }}
 *       status="{outcome}"
 *     />
 *
 * Moving a line keeps the focus on the button that moved it, so a keyboard
 * reader can press it again; when the line reaches the end and the button
 * disables itself, focus goes to the other one.
 */
export function OrderedRun({ title, hint, caption, ...content }: Props) {
  const [state, dispatch] = useReducer(
    (current: OrderedRunState, action: OrderedRunAction) =>
      reduce(current, action, content),
    content,
    initialState,
  )
  const list = useRef<HTMLOListElement>(null)
  const view = derive(state, content)
  const last = state.order.length - 1

  /**
   * The row moved, so the button under the finger belongs to a different
   * line now. Focus follows the line to the same button in its new row, or
   * to its neighbour when that one has just been disabled.
   */
  function move(action: OrderedRunAction, from: number, to: number) {
    dispatch(action)
    queueMicrotask(() => {
      const row = list.current?.children[to]
      const wanted =
        to === 0 ? "down" : to === last ? "up" : from > to ? "up" : "down"
      row?.querySelector<HTMLButtonElement>(`[data-move="${wanted}"]`)?.focus()
    })
  }

  return (
    <Explorable
      caption={caption}
      hint={hint}
      onReset={() => dispatch({ type: "reset" })}
      pristine={isInitial(state, content)}
      status={fill(content.status, { outcome: view.outcome ?? "—" })}
      title={title}
    >
      <p className="pp-explorable-column-head">{content.labels.lines}</p>
      <ol className="pp-explorable-lines" ref={list}>
        {view.rows.map((row, position) => (
          <li
            className="pp-explorable-row"
            data-line-state={row.state}
            key={row.line}
          >
            <span className="pp-explorable-cmdtext">{row.text}</span>
            <span className="pp-explorable-badge">
              {content.labels.state[row.state]}
            </span>
            {row.note && <span className="pp-explorable-note">{row.note}</span>}
            <span className="pp-explorable-moves">
              <button
                aria-label={fill(content.labels.up, { line: row.text })}
                className="pp-explorable-move"
                data-move="up"
                disabled={position === 0}
                onClick={() =>
                  move({ position, type: "up" }, position, position - 1)
                }
                type="button"
              >
                ↑
              </button>
              <button
                aria-label={fill(content.labels.down, { line: row.text })}
                className="pp-explorable-move"
                data-move="down"
                disabled={position === last}
                onClick={() =>
                  move({ position, type: "down" }, position, position + 1)
                }
                type="button"
              >
                ↓
              </button>
            </span>
          </li>
        ))}
      </ol>

      <div className="pp-explorable-release">
        <p className="pp-explorable-column-head">{content.labels.outcome}</p>
        <p className="pp-explorable-outcome">{view.outcome ?? "—"}</p>
      </div>
    </Explorable>
  )
}
