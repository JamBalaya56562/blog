/**
 * The state behind the ordering figures: a short list of lines the reader
 * can move up and down, and the consequence of the order they are in.
 *
 * Two of mise's sections turn on the same thing. In `[env]`, two lines that
 * set the same key are applied top to bottom and the last one wins — "これは
 * 実測しないと分からない挙動" is how the article puts it, which is as good a
 * case for a figure as there is. In a task's `run` array, the lines are run
 * top to bottom and the first failure ends it, so what a line does depends
 * on what is above it.
 *
 * Both are one list and one rule, so they are one figure with the rule
 * named in the content.
 */

export type OrderRule =
  /** Every line is applied; the last one to set the value wins. */
  | "lastWins"
  /** Lines run top to bottom, and the first failure ends the run. */
  | "stopOnFail"

export type OrderedLine = Readonly<{
  /** The line as the file has it. */
  text: string
  /** `lastWins`: the value this line sets, if it sets one. */
  value?: string
  /** `stopOnFail`: this line fails when it is reached. */
  fails?: boolean
  /** An aside about the line. */
  note?: string
}>

export type OrderedRunContent = Readonly<{
  rule: OrderRule
  lines: readonly OrderedLine[]
  labels: Readonly<{
    /** Heading over the list. */
    lines: string
    /** Heading over the result. */
    outcome: string
    /** Accessible names for the two controls; may use `{line}`. */
    up: string
    down: string
    /** What a line's state is called, for a reader without the colour. */
    state: Readonly<Record<LineState, string>>
  }>
  /** Spoken on each move; may use `{outcome}`. */
  status: string
}>

export type LineState =
  /** `lastWins`: this line's value is the one that survives. */
  | "wins"
  /** `lastWins`: a later line set the same value over it. */
  | "overridden"
  /** `stopOnFail`: reached and finished. */
  | "ran"
  /** `stopOnFail`: reached and failed, ending the run. */
  | "failed"
  /** `stopOnFail`: never reached. */
  | "skipped"

export type OrderedRunState = Readonly<{
  /** Indices into `lines`, in the order they are in now. */
  order: readonly number[]
}>

export type OrderedRunAction =
  | { type: "up"; position: number }
  | { type: "down"; position: number }
  | { type: "reset" }

export function initialState(content: OrderedRunContent): OrderedRunState {
  if (content.lines.length < 2) {
    throw new Error("OrderedRun: needs at least two lines")
  }
  if (content.rule === "lastWins" && !content.lines.some((l) => l.value)) {
    throw new Error("OrderedRun: lastWins needs a line that sets a value")
  }
  if (content.rule === "stopOnFail" && !content.lines.some((l) => l.fails)) {
    throw new Error("OrderedRun: stopOnFail needs a line that fails")
  }
  return { order: content.lines.map((_, index) => index) }
}

/** Swapping with the neighbour is the whole of moving a line. */
function swap(
  order: readonly number[],
  a: number,
  b: number,
): readonly number[] {
  if (a < 0 || b < 0 || a >= order.length || b >= order.length) {
    return order
  }
  const next = [...order]
  next[a] = order[b]
  next[b] = order[a]
  return next
}

export function reduce(
  state: OrderedRunState,
  action: OrderedRunAction,
  content: OrderedRunContent,
): OrderedRunState {
  switch (action.type) {
    case "up": {
      const order = swap(state.order, action.position, action.position - 1)
      return order === state.order ? state : { order }
    }
    case "down": {
      const order = swap(state.order, action.position, action.position + 1)
      return order === state.order ? state : { order }
    }
    case "reset":
      return initialState(content)
  }
}

export function isInitial(
  state: OrderedRunState,
  content: OrderedRunContent,
): boolean {
  return state.order.join() === initialState(content).order.join()
}

export type OrderedRunRow = Readonly<{
  /** Index into `content.lines`; the key, and stable across moves. */
  line: number
  text: string
  note?: string
  state: LineState
}>

export type OrderedRunView = Readonly<{
  rows: readonly OrderedRunRow[]
  /** The value that survives, or how far the run got. */
  outcome: string | null
}>

export function derive(
  state: OrderedRunState,
  content: OrderedRunContent,
): OrderedRunView {
  const lines = state.order.map((index) => content.lines[index])

  if (content.rule === "lastWins") {
    // Applied top to bottom, so the last line to set the value is the one
    // still standing at the end.
    const winner = lines.reduce(
      (found, line, position) => (line.value ? position : found),
      -1,
    )
    return {
      outcome: winner === -1 ? null : (lines[winner].value ?? null),
      rows: state.order.map((index, position) => ({
        line: index,
        note: content.lines[index].note,
        state: !content.lines[index].value
          ? "ran"
          : position === winner
            ? "wins"
            : "overridden",
        text: content.lines[index].text,
      })),
    }
  }

  const stopped = lines.findIndex((line) => line.fails === true)
  return {
    outcome: String(stopped === -1 ? lines.length : stopped + 1),
    rows: state.order.map((index, position) => ({
      line: index,
      note: content.lines[index].note,
      state:
        stopped === -1 || position < stopped
          ? "ran"
          : position === stopped
            ? "failed"
            : "skipped",
      text: content.lines[index].text,
    })),
  }
}

/**
 * How far to send a row back so it starts its travel where the reader sees
 * it. All three are measured against the top of the list.
 *
 * `from` is where the row was laid out before the change and `to` is where
 * it is laid out now. `seen` is where it is drawn now, which is `to` plus
 * whatever is left of a travel still running: a line pressed again before it
 * has arrived is still on its way, and starting the next travel from its
 * layout rather than from where it is drawn makes it jump by what was left.
 *
 * Null when there is nothing to travel, or nothing to travel from.
 */
export function travel(
  from: number | undefined,
  seen: number,
  to: number,
): number | null {
  if (from === undefined) {
    return null
  }
  const offset = from + (seen - to) - to
  return offset === 0 ? null : offset
}
