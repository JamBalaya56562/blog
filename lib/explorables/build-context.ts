/**
 * The state behind the build-context figure: what is in the directory, what
 * `.dockerignore` keeps out of it, and what is left to be sent.
 *
 * `docker build .` hands the whole directory to the engine, and `COPY` can
 * only reach what arrived — which is the part of the article that is easy to
 * read past and expensive to get wrong. Turning a line of `.dockerignore`
 * off puts the thing it was keeping out back on the wire.
 */

export type ContextEntry = Readonly<{
  /** The path as the directory listing shows it. */
  name: string
  /** What the article says about it. */
  note?: string
}>

export type BuildContextContent = Readonly<{
  entries: readonly ContextEntry[]
  /** The lines of `.dockerignore`, in the order the file has them. */
  ignore: readonly string[]
  /** Lines that start out switched off; the rest are on, as the file has them. */
  initialOff?: readonly string[]
  labels: Readonly<{
    /** Heading over the directory. */
    directory: string
    /** Heading over the ignore file. */
    ignore: string
    /** Heading over what is left. */
    sent: string
    /** Said of an entry nothing excluded. */
    sentState: string
    /** Said of an excluded entry; may use `{pattern}`. */
    excludedState: string
  }>
  /** Spoken on each change; may use `{sent}` and `{total}`. */
  status: string
}>

export type BuildContextState = Readonly<{
  /** The lines switched on right now. */
  active: readonly string[]
}>

export type BuildContextAction =
  | { type: "toggle"; pattern: string }
  | { type: "reset" }

export function initialState(content: BuildContextContent): BuildContextState {
  if (content.entries.length === 0) {
    throw new Error("BuildContext: no entries")
  }
  if (content.ignore.length === 0) {
    throw new Error("BuildContext: no ignore lines")
  }
  const off = new Set(content.initialOff ?? [])
  for (const pattern of off) {
    if (!content.ignore.includes(pattern)) {
      throw new Error(`BuildContext: "${pattern}" is not an ignore line`)
    }
  }
  return { active: content.ignore.filter((line) => !off.has(line)) }
}

export function reduce(
  state: BuildContextState,
  action: BuildContextAction,
  content: BuildContextContent,
): BuildContextState {
  switch (action.type) {
    case "toggle": {
      if (!content.ignore.includes(action.pattern)) {
        return state
      }
      const on = state.active.includes(action.pattern)
      const next = on
        ? state.active.filter((line) => line !== action.pattern)
        : content.ignore.filter(
            (line) => state.active.includes(line) || line === action.pattern,
          )
      return { active: next }
    }
    case "reset":
      return initialState(content)
  }
}

export function isInitial(
  state: BuildContextState,
  content: BuildContextContent,
): boolean {
  return state.active.join() === initialState(content).active.join()
}

/**
 * Whether a `.dockerignore` line keeps this entry out.
 *
 * The real matcher follows Go's `filepath.Match` rules, with `**` spanning
 * any number of directories. The lines this figure carries are plain names
 * and `**\/name`, so it is enough to compare the name with the pattern's
 * last component — and the figure says as much rather than pretending to be
 * the whole of the format.
 *
 * A plain name is anchored at the context root: `node_modules` keeps out the
 * one beside the Dockerfile and reaches no further. That is the whole reason
 * the file this figure is drawn from carries `**\/node_modules` as well, so
 * a matcher that let the bare line reach a nested directory would answer the
 * question the figure exists to ask.
 */
export function excludes(pattern: string, name: string): boolean {
  if (!pattern.startsWith("**/")) {
    return name === pattern
  }
  // `**` matches no directories as happily as it matches several, so the
  // globstar line covers the one at the root too.
  const bare = pattern.slice(3)
  return name === bare || name.endsWith(`/${bare}`)
}

export type ContextRow = Readonly<{
  name: string
  note?: string
  /** The line that keeps it out, or nothing when it is sent. */
  excludedBy: string | null
}>

export type BuildContextView = Readonly<{
  rows: readonly ContextRow[]
  sent: number
  total: number
}>

export function derive(
  state: BuildContextState,
  content: BuildContextContent,
): BuildContextView {
  const rows = content.entries.map(
    (entry): ContextRow => ({
      // The first line that matches is the one worth naming; the rest would
      // say the same thing about the same entry.
      excludedBy:
        state.active.find((pattern) => excludes(pattern, entry.name)) ?? null,
      name: entry.name,
      note: entry.note,
    }),
  )

  return {
    rows,
    sent: rows.filter((row) => row.excludedBy === null).length,
    total: rows.length,
  }
}
