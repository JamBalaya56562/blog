/**
 * The state behind the scripted graph figure: a short sequence of `jj log`
 * outputs from the article, and a step the reader moves through them.
 *
 * The pictures these replace were all the same thing — a graph before a
 * command and the graph after it — and the interesting part was never the
 * shape but what changed: which commit kept its change ID while its commit
 * ID moved, which descendants were carried along, where `@` ended up. So
 * each step is written out from the transcript the article already prints,
 * and the marks on the rows are computed here rather than authored: a row
 * whose commit ID differs from the step before is rewritten, one that was
 * not there is added. Where the article stated a rewrite in prose without
 * printing a hash, the row says so with `rewritten`, and that is the only
 * label it may set.
 */

import type { GraphRowView, RefKind, RowKind, RowMark } from "./graph"

export type SceneRow = Readonly<{
  /** Follows the commit across steps, the way a jj change ID does. */
  changeId: string
  desc: string
  kind: RowKind
  /** The hash the article printed, where it printed one. */
  commitId?: string
  /** An aside about this row, e.g. that it was carried along. */
  note?: string
  /**
   * Set when the article says in prose that this row was rewritten but
   * printed no hash to prove it — the descendants a rebase carries along.
   * Without it such a row would go unmarked, which is the one thing these
   * figures exist to show.
   */
  rewritten?: boolean
  lane?: 0 | 1
  rejoins?: boolean
  refs?: readonly Readonly<{ label: string; kind: RefKind }>[]
}>

export type Scene = Readonly<{
  /** What was typed to arrive here; the first step says the starting state. */
  command: string
  /** One line on what to look at. */
  caption: string
  /** Rows newest first, as `jj log` prints them. */
  rows: readonly SceneRow[]
}>

export type CommitGraphContent = Readonly<{
  scenes: readonly Scene[]
  labels: Readonly<{
    /** Accessible name of the step control, e.g. "Step". */
    step: string
    previous: string
    next: string
    /** Legend for a row whose commit ID changed. */
    rewritten: string
    /** Legend for a row that was not there before. */
    added: string
    /** Accessible name of the graph itself. */
    graph: string
  }>
  /** Spoken on each step; may use `{n}`, `{total}`, `{command}`, `{caption}`. */
  status: string
}>

export type CommitGraphState = Readonly<{ step: number }>

export type CommitGraphAction =
  | { type: "step"; to: number }
  | { type: "previous" }
  | { type: "next" }
  | { type: "reset" }

export function initialState(content: CommitGraphContent): CommitGraphState {
  if (content.scenes.length < 2) {
    throw new Error("CommitGraph: needs at least two scenes")
  }
  for (const scene of content.scenes) {
    if (scene.rows.length === 0) {
      throw new Error(`CommitGraph: scene "${scene.command}" has no rows`)
    }
    const ids = new Set(scene.rows.map((row) => row.changeId))
    if (ids.size !== scene.rows.length) {
      throw new Error(
        `CommitGraph: scene "${scene.command}" repeats a change ID`,
      )
    }
  }
  return { step: 0 }
}

export function reduce(
  state: CommitGraphState,
  action: CommitGraphAction,
  content: CommitGraphContent,
): CommitGraphState {
  const last = content.scenes.length - 1
  switch (action.type) {
    case "step": {
      if (
        !Number.isInteger(action.to) ||
        action.to < 0 ||
        action.to > last ||
        action.to === state.step
      ) {
        return state
      }
      return { step: action.to }
    }
    case "previous":
      return state.step === 0 ? state : { step: state.step - 1 }
    case "next":
      return state.step === last ? state : { step: state.step + 1 }
    case "reset":
      return initialState(content)
  }
}

export function isInitial(state: CommitGraphState): boolean {
  return state.step === 0
}

/**
 * The rows of a step, each marked against the step before it. The first step
 * marks nothing: there is nothing yet to have changed.
 */
export function rowsOf(
  content: CommitGraphContent,
  step: number,
): readonly GraphRowView[] {
  const scene = content.scenes[step]
  const before = step > 0 ? content.scenes[step - 1] : undefined

  return scene.rows.map((row): GraphRowView => {
    const previous = before?.rows.find((old) => old.changeId === row.changeId)
    // A hash that appeared, changed or was declared changed all mean the
    // same thing to the reader: this commit is not the one that was there.
    const hashMoved =
      previous !== undefined &&
      row.commitId !== undefined &&
      previous.commitId !== row.commitId
    const mark: RowMark = !before
      ? "same"
      : previous === undefined
        ? "added"
        : hashMoved || row.rewritten === true
          ? "rewritten"
          : "same"

    return {
      commitId: row.commitId,
      desc: row.desc,
      key: row.changeId,
      kind: row.kind,
      lane: row.lane,
      mark,
      markLabel:
        mark === "rewritten"
          ? content.labels.rewritten
          : mark === "added"
            ? content.labels.added
            : undefined,
      note: row.note,
      refs: row.refs ?? [],
      rejoins: row.rejoins,
    }
  })
}
