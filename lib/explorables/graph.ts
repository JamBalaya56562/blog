/**
 * The shape of one row of a commit graph, shared by every figure that draws
 * one.
 *
 * A row is what `jj log` or `sl` prints on one line: a node, what the commit
 * says, and the names pointing at it. Figures differ in how they arrive at
 * their rows; `components/explorables/graph-rows.tsx` draws whatever they
 * produce.
 */

/** The glyph: the working copy, an ordinary commit, or one the remote holds. */
export type RowKind = "at" | "commit" | "immutable"

export type RefKind = "head" | "at" | "bookmark" | "remote"

/** How this row differs from the same commit in the step before it. */
export type RowMark = "same" | "added" | "rewritten"

export type GraphRowView = Readonly<{
  /** Stable across steps, so React keeps the row and its place. */
  key: string
  kind: RowKind
  desc: string
  /** The commit hash, where the article printed one. */
  commitId?: string
  /** A word about this row in particular, e.g. that it was restacked. */
  note?: string
  mark?: RowMark
  /**
   * Which column the node sits in. Graphs here are linear or a single fork,
   * so there are two: 0 is the trunk and 1 is the side a change sits on
   * while the trunk moves past it.
   */
  lane?: 0 | 1
  /** This row's parent is on lane 0, so the line bends back into the trunk. */
  rejoins?: boolean
  refs: readonly Readonly<{ label: string; kind: RefKind }>[]
}>
