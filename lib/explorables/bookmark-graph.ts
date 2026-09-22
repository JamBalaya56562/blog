/**
 * The state behind the bookmark figure: the same three commands run against
 * Git and against jj, side by side, so the reader can watch one pointer move
 * and the other stay.
 *
 * Git's branch follows the commits: commit while on `main` and `main` is
 * where you land. A jj bookmark is a place you put a name, and it stays
 * there until you move it — which is the whole of the article's claim, and
 * the property test at the bottom of the suite.
 *
 * Both histories are linear: a commit's parent is the one before it in the
 * array, index 0 is the oldest, and the row list is drawn newest first the
 * way `jj log` prints it.
 */

export type Commit = Readonly<{
  /** What the commit says, or the empty string for jj's working copy. */
  desc: string
  /** Pushed, so jj will not let it be rewritten. */
  immutable: boolean
}>

export type Side = Readonly<{
  commits: readonly Commit[]
  /** Index of `HEAD` on the Git side, of `@` on the jj side. */
  head: number
  /** Index the branch or bookmark names. */
  main: number
  /** Index the remote's `main` names, or nothing pushed yet. */
  remoteMain: number | null
}>

export type BookmarkContent = Readonly<{
  /** Commit messages, used in order; the first one is already in both sides. */
  descs: readonly string[]
  /** What jj's working copy shows while it has no description. */
  empty: string
  commands: Readonly<{
    commit: Readonly<{ git: string; jj: string }>
    bookmark: Readonly<{ git: string; jj: string }>
    push: Readonly<{ git: string; jj: string }>
  }>
  labels: Readonly<{
    /** Column headings. */
    git: string
    jj: string
    /** Chips on the rows. */
    head: string
    at: string
    main: string
    remote: string
  }>
  /** Spoken after each action; may use `{desc}`. */
  status: Readonly<Record<LastAction, string>>
}>

export type LastAction = "initial" | "commit" | "bookmark" | "push"

export type BookmarkState = Readonly<{
  git: Side
  jj: Side
  /** Index into `descs` of the message the next commit takes. */
  next: number
  last: LastAction
}>

export type BookmarkAction =
  | { type: "commit" }
  | { type: "bookmark" }
  | { type: "push" }
  | { type: "reset" }

export function initialState(content: BookmarkContent): BookmarkState {
  if (content.descs.length === 0) {
    throw new Error("BookmarkGraph: no descs")
  }
  const first: Commit = { desc: content.descs[0], immutable: false }
  return {
    git: { commits: [first], head: 0, main: 0, remoteMain: null },
    // jj's working copy is a commit of its own, empty until it is described,
    // and it sits on top from the start: that is what `jj log` shows in a
    // fresh clone.
    jj: {
      commits: [first, { desc: "", immutable: false }],
      head: 1,
      main: 0,
      remoteMain: null,
    },
    last: "initial",
    next: 1,
  }
}

/**
 * Whether the button for this action does anything right now. A figure with
 * a button that quietly does nothing teaches the wrong lesson, so the ones
 * that cannot act are disabled instead.
 */
export function allowed(
  state: BookmarkState,
  action: BookmarkAction,
  content: BookmarkContent,
): boolean {
  switch (action.type) {
    case "commit":
      return state.next < content.descs.length
    case "bookmark":
      return state.jj.main !== state.jj.head - 1
    case "push":
      return state.jj.remoteMain !== state.jj.main
    case "reset":
      return true
  }
}

function commitOnGit(side: Side, desc: string): Side {
  const commits = [...side.commits, { desc, immutable: false }]
  const head = commits.length - 1
  // The branch is carried along: this is the difference the figure is about.
  return { ...side, commits, head, main: head }
}

function commitOnJj(side: Side, desc: string): Side {
  // The working copy is described in place, then a fresh empty one is made
  // on top — `jj describe` followed by `jj new`. The bookmark is not part of
  // either step, so it stays where it was.
  const described = side.commits.map((commit, i) =>
    i === side.head ? { ...commit, desc } : commit,
  )
  const commits = [...described, { desc: "", immutable: false }]
  return { ...side, commits, head: commits.length - 1 }
}

function push(side: Side): Side {
  return {
    ...side,
    // Everything the remote now holds is out of reach of a rewrite.
    commits: side.commits.map((commit, i) =>
      i <= side.main ? { ...commit, immutable: true } : commit,
    ),
    remoteMain: side.main,
  }
}

export function reduce(
  state: BookmarkState,
  action: BookmarkAction,
  content: BookmarkContent,
): BookmarkState {
  if (!allowed(state, action, content)) {
    return state
  }

  switch (action.type) {
    case "commit": {
      const desc = content.descs[state.next]
      return {
        git: commitOnGit(state.git, desc),
        jj: commitOnJj(state.jj, desc),
        last: "commit",
        next: state.next + 1,
      }
    }
    case "bookmark":
      // `jj bookmark set main -r @-`: the name moves to the commit just
      // described, never to the empty working copy.
      return {
        ...state,
        jj: { ...state.jj, main: state.jj.head - 1 },
        last: "bookmark",
      }
    case "push":
      return {
        ...state,
        git: push(state.git),
        jj: push(state.jj),
        last: "push",
      }
    case "reset":
      return initialState(content)
  }
}

export function isInitial(
  state: BookmarkState,
  content: BookmarkContent,
): boolean {
  const initial = initialState(content)
  return state.next === initial.next && state.last === initial.last
}

export type RowKind = "at" | "commit" | "immutable"
export type RefKind = "head" | "at" | "bookmark" | "remote"

export type Row = Readonly<{
  index: number
  kind: RowKind
  desc: string
  refs: readonly Readonly<{ label: string; kind: RefKind }>[]
}>

/** One side's commits, newest first, with the names that point at them. */
export function rowsOf(
  side: Side,
  content: BookmarkContent,
  isJj: boolean,
): readonly Row[] {
  return side.commits
    .map((commit, index): Row => {
      const refs: { label: string; kind: RefKind }[] = []
      if (index === side.head) {
        refs.push({
          kind: isJj ? "at" : "head",
          label: isJj ? content.labels.at : content.labels.head,
        })
      }
      if (index === side.main) {
        refs.push({ kind: "bookmark", label: content.labels.main })
      }
      if (index === side.remoteMain) {
        refs.push({ kind: "remote", label: content.labels.remote })
      }
      return {
        desc: commit.desc === "" ? content.empty : commit.desc,
        index,
        kind: commit.immutable
          ? "immutable"
          : isJj && index === side.head
            ? "at"
            : "commit",
        refs,
      }
    })
    .reverse()
}
