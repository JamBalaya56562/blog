"use client"

import { useReducer } from "react"
import { fill, formatSeconds } from "@/lib/explorables/format"
import {
  derive,
  initialState,
  isInitial,
  type LayerCacheAction,
  type LayerCacheContent,
  type LayerCacheState,
  reduce,
} from "@/lib/explorables/layer-cache"
import { Explorable } from "./explorable"

type Props = LayerCacheContent &
  Readonly<{
    title: string
    hint?: string
    caption?: string
  }>

/**
 * A Dockerfile whose build cache the reader can break.
 *
 * Each step is a button. Pressing one means "the file this step copies has
 * changed": that step and every step below it lose their `CACHED` badge and
 * the rebuild time at the bottom grows by their durations. When the MDX
 * offers more than one arrangement of the same steps, a switch above the list
 * changes the order, so the reader can see the same edit cost eight minutes
 * with the lockfile copied first and fourteen with the sources first.
 *
 * Authored in MDX with every word in the article's language:
 *
 *     <LayerCache
 *       title="Dockerfile"
 *       hint="Click a line to change the file it copies"
 *       steps={[
 *         { cmd: "COPY pnpm-lock.yaml ./", note: "changes now and then", seconds: 1 },
 *         { cmd: "RUN pnpm install", note: "five and a half minutes", seconds: 330 },
 *       ]}
 *       orders={[{ label: "lockfile first", order: [0, 1] }]}
 *       changed={1}
 *       labels={{ cached: "CACHED", changed: "changed", rerun: "re-run", total: "rebuild", order: "Order" }}
 *       status={{ none: "Nothing changed: every step is CACHED", some: "{cmd} changed: {rerun} steps re-run, {time}" }}
 *       caption="Everything below the changed line is redone"
 *     />
 *
 * Three things the lints ask of the MDX: no `*` inside a prop string (the
 * emphasis lint reads the tag as text), one prop per line under 120 columns
 * in the English post, and a blank line on either side of the tag.
 *
 * The badges say what BuildKit prints — `CACHED`, `DONE 4.5s` — in both
 * locales, because that is what the reader sees in their own terminal. The
 * served markup is the state the props describe, so the figure means the
 * same thing before hydration as after.
 */
export function LayerCache({ title, hint, caption, ...content }: Props) {
  const [state, dispatch] = useReducer(
    (current: LayerCacheState, action: LayerCacheAction) =>
      reduce(current, action, content),
    content,
    initialState,
  )
  const view = derive(state, content)
  const changedRow = view.rows.find((row) => row.state === "changed")
  const status = changedRow
    ? fill(content.status.some, {
        cmd: changedRow.cmd,
        rerun: view.rerunCount,
        time: formatSeconds(view.seconds),
      })
    : content.status.none
  const share =
    view.totalSeconds === 0 ? 0 : (view.seconds / view.totalSeconds) * 100

  /**
   * What the figure can say: nothing changed, or one of the steps did, in
   * each of the orders. The sentence names the step, so its length changes
   * with the step, and on a phone that is a line more or less under a
   * figure the reader is in the middle of.
   */
  const statuses = [
    content.status.none,
    ...content.orders.flatMap((_, order) =>
      content.steps.map((_step, step) => {
        const marked = derive(
          reduce(
            reduce(
              initialState(content),
              { index: order, type: "order" },
              content,
            ),
            { step, type: "toggle" },
            content,
          ),
          content,
        )
        const changed = marked.rows.find((row) => row.state === "changed")
        return changed
          ? fill(content.status.some, {
              cmd: changed.cmd,
              rerun: marked.rerunCount,
              time: formatSeconds(marked.seconds),
            })
          : content.status.none
      }),
    ),
  ]

  return (
    <Explorable
      caption={caption}
      hint={hint}
      onReset={() => dispatch({ type: "reset" })}
      pristine={isInitial(state, content)}
      status={status}
      statuses={statuses}
      title={title}
    >
      {content.orders.length > 1 && (
        <fieldset className="pp-explorable-controls">
          <legend className="sr-only">{content.labels.order}</legend>
          {content.orders.map((order, index) => (
            <button
              aria-pressed={index === state.orderIndex}
              className="pp-explorable-cmd"
              key={order.label}
              onClick={() => dispatch({ index, type: "order" })}
              type="button"
            >
              {order.label}
            </button>
          ))}
        </fieldset>
      )}
      <div className="grid gap-2">
        {view.rows.map((row) => (
          <button
            aria-pressed={row.state === "changed"}
            className="pp-explorable-row"
            data-state={row.state}
            key={row.step}
            onClick={() => dispatch({ step: row.step, type: "toggle" })}
            type="button"
          >
            <span className="pp-explorable-cmdtext">{row.cmd}</span>
            <span className="pp-explorable-badge">
              {row.state === "cached"
                ? "CACHED"
                : `DONE ${row.seconds.toFixed(1)}s`}
            </span>
            <span className="pp-explorable-note">{row.note}</span>
          </button>
        ))}
      </div>
      <div className="pp-explorable-total">
        <span className="pp-explorable-note">{content.labels.total}</span>
        <span className="pp-explorable-badge">
          {formatSeconds(view.seconds)} / {formatSeconds(view.totalSeconds)}
        </span>
        <div
          aria-hidden="true"
          className="pp-explorable-bar"
          style={{ "--pp-explorable-bar": `${share}%` } as React.CSSProperties}
        />
      </div>
      <div className="pp-explorable-legend">
        <span data-state="cached">{content.labels.cached}</span>
        <span data-state="changed">{content.labels.changed}</span>
        <span data-state="rerun">{content.labels.rerun}</span>
      </div>
    </Explorable>
  )
}
