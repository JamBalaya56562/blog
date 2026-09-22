"use client"

import { useId, useReducer } from "react"
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
 * Write the rows from the transcript, newest first. A row keeps its place
 * across steps by its change ID, so use the real one; the commit IDs are
 * what the marks are computed from, so give them where the article printed
 * them and leave them out where it did not.
 */
export function CommitGraph({ title, hint, caption, ...content }: Props) {
  const [state, dispatch] = useReducer(
    (current: CommitGraphState, action: CommitGraphAction) =>
      reduce(current, action, content),
    content,
    initialState,
  )
  const id = useId()
  const last = content.scenes.length - 1
  const scene = content.scenes[state.step]
  const rows = rowsOf(content, state.step)

  return (
    <Explorable
      caption={caption}
      hint={hint}
      onReset={() => dispatch({ type: "reset" })}
      pristine={isInitial(state)}
      status={fill(content.status, {
        caption: scene.caption,
        command: scene.command,
        n: state.step + 1,
        total: content.scenes.length,
      })}
      title={title}
    >
      <div className="pp-explorable-steps">
        <button
          className="pp-explorable-cmd"
          disabled={state.step === 0}
          onClick={() => dispatch({ type: "previous" })}
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
          onClick={() => dispatch({ type: "next" })}
          type="button"
        >
          {content.labels.next}
        </button>
      </div>

      <p className="pp-explorable-command">{scene.command}</p>
      <GraphRows label={content.labels.graph} rows={rows} />

      <div className="pp-explorable-legend">
        <span data-mark="rewritten">{content.labels.rewritten}</span>
        <span data-mark="added">{content.labels.added}</span>
      </div>
    </Explorable>
  )
}
