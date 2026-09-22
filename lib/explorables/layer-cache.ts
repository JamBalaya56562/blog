/**
 * The state behind the layer-cache figure: a Dockerfile as a list of steps,
 * one of which the reader has "changed", and the rule that decides which of
 * them BuildKit would rebuild.
 *
 * The rule is the one the article states — a step is reused only when it and
 * every step before it are unchanged — so a change at position `p` leaves the
 * steps above it `CACHED` and re-runs `p` and everything below. Reordering the
 * steps is the second half of the argument: the same change costs a different
 * amount of time depending on where the heavy step sits.
 *
 * Pure functions, no React. The component holds a `LayerCacheState` in a
 * reducer and asks `derive` for what to draw.
 */

export type LayerCacheStep = Readonly<{
  /** The Dockerfile line, shown verbatim. */
  cmd: string
  /** What the article says about it — why it changes rarely or often. */
  note: string
  /** How long the step takes when it is not cached. */
  seconds: number
}>

export type LayerCacheOrder = Readonly<{
  /** The name of this arrangement, e.g. "lockfile first". */
  label: string
  /** Step indices in the order they run: a permutation of `0..steps.length`. */
  order: readonly number[]
}>

export type LayerCacheContent = Readonly<{
  steps: readonly LayerCacheStep[]
  /** At least one arrangement; the first is the initial one. */
  orders: readonly LayerCacheOrder[]
  /** The step that starts out changed, or none. */
  changed: number | null
  labels: Readonly<{
    /** Legend for a step that starts out cached. */
    cached: string
    /** Legend for the step the reader changed. */
    changed: string
    /** Legend for a step that re-runs because one above it changed. */
    rerun: string
    /** Heading of the total-time row. */
    total: string
    /** Accessible name of the arrangement switch. */
    order: string
  }>
  status: Readonly<{
    /** Spoken when nothing is changed. */
    none: string
    /** Spoken when a step is changed; may use `{cmd}`, `{rerun}`, `{time}`. */
    some: string
  }>
}>

export type LayerCacheState = Readonly<{
  orderIndex: number
  /** Index into `steps`, not a position in the order. */
  changed: number | null
}>

export type LayerCacheAction =
  | { type: "toggle"; step: number }
  | { type: "order"; index: number }
  | { type: "reset" }

export type RowState = "cached" | "changed" | "rerun"

export type LayerCacheRow = Readonly<{
  step: number
  state: RowState
  cmd: string
  note: string
  seconds: number
}>

export type LayerCacheView = Readonly<{
  rows: readonly LayerCacheRow[]
  /** Steps that run again, the changed one included. */
  rerunCount: number
  /** Time the rebuild takes. */
  seconds: number
  /** Time a build from nothing takes. */
  totalSeconds: number
}>

function isPermutation(order: readonly number[], length: number): boolean {
  if (order.length !== length) {
    return false
  }
  const seen = new Set(order)
  return (
    seen.size === length &&
    order.every((i) => Number.isInteger(i) && i >= 0 && i < length)
  )
}

/**
 * The state the figure is served with. Throws on content that cannot be
 * drawn: every post is prerendered at build time, so a broken figure in either
 * locale fails `next build` instead of a page.
 */
export function initialState(content: LayerCacheContent): LayerCacheState {
  const { steps, orders, changed } = content
  if (steps.length === 0) {
    throw new Error("LayerCache: no steps")
  }
  if (orders.length === 0) {
    throw new Error("LayerCache: no orders")
  }
  for (const step of steps) {
    if (!Number.isFinite(step.seconds) || step.seconds < 0) {
      throw new Error(`LayerCache: bad duration for ${step.cmd}`)
    }
  }
  for (const { label, order } of orders) {
    if (!isPermutation(order, steps.length)) {
      throw new Error(`LayerCache: order "${label}" is not a permutation`)
    }
  }
  if (
    changed !== null &&
    (!Number.isInteger(changed) || changed < 0 || changed >= steps.length)
  ) {
    throw new Error(`LayerCache: changed=${changed} but ${steps.length} steps`)
  }
  return { changed, orderIndex: 0 }
}

export function reduce(
  state: LayerCacheState,
  action: LayerCacheAction,
  content: LayerCacheContent,
): LayerCacheState {
  switch (action.type) {
    case "toggle": {
      if (action.step < 0 || action.step >= content.steps.length) {
        return state
      }
      return {
        ...state,
        changed: state.changed === action.step ? null : action.step,
      }
    }
    case "order": {
      if (action.index < 0 || action.index >= content.orders.length) {
        return state
      }
      return { ...state, orderIndex: action.index }
    }
    case "reset":
      return initialState(content)
  }
}

export function isInitial(
  state: LayerCacheState,
  content: LayerCacheContent,
): boolean {
  const initial = initialState(content)
  return (
    state.orderIndex === initial.orderIndex && state.changed === initial.changed
  )
}

export function derive(
  state: LayerCacheState,
  content: LayerCacheContent,
): LayerCacheView {
  const order = content.orders[state.orderIndex]?.order ?? []
  const position = state.changed === null ? -1 : order.indexOf(state.changed)
  const rows = order.map((step, i): LayerCacheRow => {
    const { cmd, note, seconds } = content.steps[step]
    const rowState: RowState =
      position === -1 || i < position
        ? "cached"
        : i === position
          ? "changed"
          : "rerun"
    return { cmd, note, seconds, state: rowState, step }
  })
  const rerun = rows.filter((row) => row.state !== "cached")
  return {
    rerunCount: rerun.length,
    rows,
    seconds: rerun.reduce((sum, row) => sum + row.seconds, 0),
    totalSeconds: rows.reduce((sum, row) => sum + row.seconds, 0),
  }
}
