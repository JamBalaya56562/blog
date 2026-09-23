"use client"

import { useLayoutEffect, useReducer, useRef } from "react"
import { fill } from "@/lib/explorables/format"
import {
  derive,
  initialState,
  isInitial,
  type OrderedRunAction,
  type OrderedRunContent,
  type OrderedRunState,
  reduce,
  travel,
} from "@/lib/explorables/ordered-run"
import { Explorable } from "./explorable"
import { Frame } from "./frame"

/** Names this figure's own animation, so it cancels nothing else on a row. */
const TRAVEL = "pp-explorable-travel"

type Props = OrderedRunContent &
  Readonly<{
    title: string
    hint?: string
    caption?: string
  }>

/** Every order a list of lines can be put in. */
function orders(indices: readonly number[]): readonly (readonly number[])[] {
  if (indices.length <= 1) {
    return [indices]
  }
  return indices.flatMap((index, at) =>
    orders([...indices.slice(0, at), ...indices.slice(at + 1)]).map((rest) => [
      index,
      ...rest,
    ]),
  )
}

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
  const places = useRef(new Map<string, number>())

  /**
   * A line that moves, moves.
   *
   * The list is the one figure here whose point is a thing changing places,
   * and a row that is simply drawn somewhere else leaves the reader to work
   * out which row went where. So each row is put back where it was and let
   * go: the browser has already laid the new order out, so the travel is
   * only what the reader watches, and the layout it lands in is the one
   * that was measured.
   *
   * It runs after layout and before paint, so no frame is drawn with the
   * rows in their new places before they are sent back to their old ones.
   * A reader who asked for less motion gets the new order and no travel.
   *
   * A row is placed against the top of the list rather than the top of the
   * window. The window's top moves when the reader scrolls, and scrolling
   * does not re-render, so the reading kept from last time would be in one
   * frame of reference and this one in another: a line moved after scrolling
   * down to the figure would be sent back that far and fly in from off
   * screen, and so would the lines that had not moved at all.
   *
   * A line can be pressed again before it has arrived. Where it is drawn
   * then is not where it is laid out, so each row is read twice: once as
   * drawn, and once with its travel stopped, which is the layout. The
   * layout is what is kept for next time, and the next travel starts from
   * where the row was drawn rather than jumping by what was left.
   */
  useLayoutEffect(() => {
    const rows = [
      ...(list.current?.querySelectorAll<HTMLElement>("li[data-line]") ?? []),
    ]
    const top = list.current?.getBoundingClientRect().top ?? 0
    const before = places.current
    // Every row is read, then every travel stopped, then every row read
    // again: reading after each stop would have the browser work the page's
    // style out again once per row rather than once for the list.
    const drawn = rows.map((row) => row.getBoundingClientRect().top - top)
    for (const row of rows) {
      for (const running of row.getAnimations()) {
        if (running.id === TRAVEL) {
          running.cancel()
        }
      }
    }
    const moves = rows.map((row, index) => ({
      from: before.get(row.dataset.line ?? ""),
      row,
      seen: drawn[index],
      to: row.getBoundingClientRect().top - top,
    }))
    places.current = new Map(
      moves.map(({ row, to }) => [row.dataset.line ?? "", to]),
    )

    if (
      before.size === 0 ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return
    }
    for (const { from, row, seen, to } of moves) {
      const offset = travel(from, seen, to)
      if (offset === null) {
        continue
      }
      row.animate(
        [{ transform: `translateY(${offset}px)` }, { transform: "none" }],
        {
          duration: 220,
          easing: "cubic-bezier(0.2, 0.7, 0.3, 1)",
          id: TRAVEL,
        },
      )
    }
  })
  const view = derive(state, content)
  /**
   * Every answer these lines can come to, in any order they can be put in.
   * The lists are three or four lines long, so walking the orders is a
   * handful of pure calls, and it is what lets the answer keep its height
   * whichever line ends up on top.
   */
  const outcomes = [
    ...new Set(
      orders(content.lines.map((_, index) => index)).map(
        (order) => derive({ order }, content).outcome ?? "—",
      ),
    ),
  ]
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
      statuses={outcomes.map((outcome) => fill(content.status, { outcome }))}
      title={title}
    >
      <p className="pp-explorable-column-head">{content.labels.lines}</p>
      <ol className="pp-explorable-lines" data-reorder="true" ref={list}>
        {view.rows.map((row, position) => (
          <li
            className="pp-explorable-row"
            data-line={row.line}
            data-line-state={row.state}
            key={row.line}
          >
            <span className="pp-explorable-cmdtext">{row.text}</span>
            {/* A line's state is one of three words, and the longest of
                them wraps where the shortest does not. All three are laid
                into the badge's cell, so moving a line never makes the row
                it moved past a line taller. */}
            <Frame
              active={0}
              panes={[
                content.labels.state[row.state],
                ...Object.values(content.labels.state).filter(
                  (word) => word !== content.labels.state[row.state],
                ),
              ].map((word) => (
                <span className="pp-explorable-badge" key={word}>
                  {word}
                </span>
              ))}
            />
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

      {/* Every answer the lines can come to, so the line that prints it
          keeps its height however long that answer is. */}
      <Frame
        active={0}
        panes={[
          view.outcome ?? "—",
          ...outcomes.filter((outcome) => outcome !== (view.outcome ?? "—")),
        ].map((outcome) => (
          <div className="pp-explorable-release" key={outcome}>
            <p className="pp-explorable-column-head">
              {content.labels.outcome}
            </p>
            <p className="pp-explorable-outcome">{outcome}</p>
          </div>
        ))}
      />
    </Explorable>
  )
}
