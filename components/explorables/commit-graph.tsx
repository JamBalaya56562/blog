"use client"

import { useId, useReducer, useRef } from "react"
import {
  type CommitGraphAction,
  type CommitGraphContent,
  type CommitGraphState,
  initialState,
  isInitial,
  reduce,
  rowsOf,
} from "@/lib/explorables/commit-graph"
import { fill } from "@/lib/explorables/format"
import { Explorable } from "./explorable"
import { Frame } from "./frame"
import { GraphRows } from "./graph-rows"

type Props = CommitGraphContent &
  Readonly<{
    title: string
    hint?: string
    caption?: string
  }>

/**
 * A `jj log` the reader steps through, one command at a time.
 *
 * The pictures this replaces each showed a graph before a command and after
 * it. Here the steps are the article's own transcripts, and moving between
 * them marks the rows that changed: a commit whose ID moved while its change
 * ID stayed is the thing these sections are about, and it is computed rather
 * than labelled by hand.
 *
 * Authored in MDX, one figure per command the section explains:
 *
 *     <CommitGraph
 *       title="jj squash README.md"
 *       hint="Step through it"
 *       scenes={[
 *         { command: "jj log", caption: "Before", rows: [
 *           { changeId: "oklvxylu", desc: "Greet the world", commitId: "bf873b9b", kind: "commit" },
 *         ] },
 *         { command: "jj squash README.md", caption: "After", rows: [
 *           { changeId: "oklvxylu", desc: "Greet the world", commitId: "901a7c31", kind: "commit" },
 *         ] },
 *       ]}
 *       labels={{ step: "Step", previous: "Back", next: "Forward", rewritten: "new commit ID", added: "new", graph: "jj log" }}
 *       status="{n}/{total} · {command} — {caption}"
 *     />
 *
 * Write the rows from the transcript, newest first. `changeId` is what keeps
 * a row in its place across steps: jj prints one, and for a tool that does
 * not — Sapling rewrites the hash on every amend — any stable word will do,
 * since it is never shown. The commit IDs are what the marks are computed
 * from, so give them where the article printed them and leave them out
 * where it did not.
 */
export function CommitGraph({ title, hint, caption, ...content }: Props) {
  const [state, dispatch] = useReducer(
    (current: CommitGraphState, action: CommitGraphAction) =>
      reduce(current, action, content),
    content,
    initialState,
  )
  const id = useId()
  const range = useRef<HTMLInputElement>(null)
  const last = content.scenes.length - 1
  const scene = content.scenes[state.step]

  /** What the figure says at one step; every step's is reserved for. */
  function sentence(step: number): string {
    const at = content.scenes[step]
    return fill(content.status, {
      caption: at.caption,
      command: at.command,
      n: step + 1,
      total: content.scenes.length,
    })
  }

  /**
   * The button at the end of the sequence disables itself under the reader's
   * finger, which would drop focus to the document. The slider is the same
   * control by other means, and it is always there, so focus goes to it.
   */
  function move(action: CommitGraphAction, willEnd: boolean) {
    dispatch(action)
    if (willEnd) {
      range.current?.focus()
    }
  }

  return (
    <Explorable
      caption={caption}
      hint={hint}
      onReset={() => dispatch({ type: "reset" })}
      pristine={isInitial(state)}
      status={sentence(state.step)}
      statuses={content.scenes.map((_, index) => sentence(index))}
      title={title}
    >
      <div className="pp-explorable-steps">
        <button
          className="pp-explorable-cmd"
          disabled={state.step === 0}
          onClick={() => move({ type: "previous" }, state.step === 1)}
          type="button"
        >
          {content.labels.previous}
        </button>
        <label className="sr-only" htmlFor={id}>
          {content.labels.step}
        </label>
        <input
          aria-valuetext={`${state.step + 1}/${content.scenes.length} ${scene.command}`}
          className="pp-explorable-range"
          id={id}
          ref={range}
          max={last}
          min={0}
          onChange={(event) =>
            dispatch({ to: Number(event.target.value), type: "step" })
          }
          step={1}
          type="range"
          value={state.step}
        />
        <button
          className="pp-explorable-cmd"
          disabled={state.step === last}
          onClick={() => move({ type: "next" }, state.step === last - 1)}
          type="button"
        >
          {content.labels.next}
        </button>
      </div>

      {/* Every step is laid out on top of the others, so the figure is as
          tall as its longest graph from the first render and stepping
          through it moves nothing under it. */}
      <Frame
        active={state.step}
        panes={content.scenes.map((step, index) => {
          const stepRows = rowsOf(content, index)
          return (
            <>
              <p className="pp-explorable-command">{step.command}</p>
              <GraphRows label={content.labels.graph} rows={stepRows} />

              {/* A swatch for a colour nothing on screen is wearing explains
                  nothing, so the legend says only what this step shows. */}
              {stepRows.some((row) => row.mark !== "same") && (
                <div className="pp-explorable-legend">
                  {stepRows.some((row) => row.mark === "rewritten") && (
                    <span data-mark="rewritten">
                      {content.labels.rewritten}
                    </span>
                  )}
                  {stepRows.some((row) => row.mark === "added") && (
                    <span data-mark="added">{content.labels.added}</span>
                  )}
                </div>
              )}
            </>
          )
        })}
      />
    </Explorable>
  )
}
