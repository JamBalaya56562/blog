import { describe, expect, test } from "bun:test"
import fc from "fast-check"
import {
  allowed,
  type BookmarkAction,
  type BookmarkContent,
  type BookmarkState,
  initialState,
  isInitial,
  reduce,
  rowsOf,
} from "@/lib/explorables/bookmark-graph"

const content: BookmarkContent = {
  commands: {
    bookmark: { git: "—", jj: "jj bookmark set main -r @-" },
    commit: { git: "git commit", jj: "jj describe + jj new" },
    push: { git: "git push", jj: "jj git push --bookmark main" },
  },
  descs: ["Add README", "Greet the world", "Add a licence note"],
  empty: "(empty)",
  labels: {
    at: "@",
    git: "Git",
    head: "HEAD",
    jj: "jj",
    main: "main",
    remote: "origin/main",
  },
  status: {
    bookmark: "moved",
    commit: "committed {desc}",
    initial: "start",
    push: "pushed",
    pushGitOnly: "git only",
  },
}

const action = fc.constantFrom<BookmarkAction>(
  { type: "commit" },
  { type: "bookmark" },
  { type: "push" },
  { type: "reset" },
)
const actions = fc.array(action, { maxLength: 14 })

function run(list: readonly BookmarkAction[]): BookmarkState {
  return list.reduce((s, a) => reduce(s, a, content), initialState(content))
}

describe("bookmark graph", () => {
  /**
   * The article's claim, as an invariant: "Git では main にいる状態でコミット
   * すれば main が進みます". Whatever the reader presses, Git's branch is
   * wherever Git's HEAD is.
   */
  test("Property 1: Git's branch never leaves HEAD", () => {
    fc.assert(
      fc.property(actions, (list) => {
        const { git } = run(list)
        expect(git.main).toBe(git.head)
      }),
      { numRuns: 300 },
    )
  })

  /** The other half: "jj の bookmark は、置いたコミットにそのまま留まります". */
  test("Property 2: jj's bookmark moves only when it is moved", () => {
    fc.assert(
      fc.property(actions, (list) => {
        let state = initialState(content)
        for (const a of list) {
          const before = state.jj.main
          state = reduce(state, a, content)
          if (a.type !== "bookmark" && a.type !== "reset") {
            expect(state.jj.main).toBe(before)
          }
        }
      }),
      { numRuns: 300 },
    )
  })

  test("Property 3: a commit adds exactly one commit to each side", () => {
    fc.assert(
      fc.property(actions, (list) => {
        let state = initialState(content)
        for (const a of list) {
          const git = state.git.commits.length
          const jj = state.jj.commits.length
          const acts = allowed(state, a, content)
          state = reduce(state, a, content)
          const grew = acts && a.type === "commit" ? 1 : 0
          if (a.type === "reset") {
            continue
          }
          expect(state.git.commits.length).toBe(git + grew)
          expect(state.jj.commits.length).toBe(jj + grew)
        }
      }),
      { numRuns: 300 },
    )
  })

  /** `jj new` leaves an empty working copy on top; nothing else touches it. */
  test("Property 4: jj's top commit is always the empty working copy", () => {
    fc.assert(
      fc.property(actions, (list) => {
        const { jj } = run(list)
        expect(jj.head).toBe(jj.commits.length - 1)
        expect(jj.commits[jj.head].desc).toBe("")
        expect(jj.commits[jj.head].immutable).toBe(false)
      }),
      { numRuns: 300 },
    )
  })

  test("Property 5: on jj, immutable is exactly what the remote holds", () => {
    fc.assert(
      fc.property(actions, (list) => {
        const { jj } = run(list)
        jj.commits.forEach((commit, i) => {
          expect(commit.immutable).toBe(
            jj.remoteMain !== null && i <= jj.remoteMain,
          )
        })
      }),
      { numRuns: 300 },
    )
  })

  /**
   * Immutability is jj's rule, not Git's: `git commit --amend` and a forced
   * push are still there after a push. Marking Git's commits would put one
   * tool's rule on the other in a figure whose job is to keep them apart.
   */
  test("Property 5b: nothing on the Git side is ever immutable", () => {
    fc.assert(
      fc.property(actions, (list) => {
        expect(run(list).git.commits.every((c) => !c.immutable)).toBe(true)
      }),
      { numRuns: 300 },
    )
  })

  test("Property 6: a disallowed action changes nothing", () => {
    fc.assert(
      fc.property(actions, action, (list, next) => {
        const state = run(list)
        if (allowed(state, next, content)) {
          return
        }
        expect(reduce(state, next, content)).toBe(state)
      }),
      { numRuns: 300 },
    )
  })

  test("Property 7: reset returns to the served state", () => {
    fc.assert(
      fc.property(actions, (list) => {
        const back = reduce(run(list), { type: "reset" }, content)
        expect(back).toEqual(initialState(content))
        expect(isInitial(back, content)).toBe(true)
      }),
      { numRuns: 300 },
    )
  })

  /**
   * The divergence the figure exists to show, spelled out: one commit, and
   * the two `main`s are no longer at the same place relative to the tip.
   */
  test("one commit moves Git's branch and leaves jj's behind", () => {
    const state = reduce(initialState(content), { type: "commit" }, content)

    expect(state.git.commits.map((c) => c.desc)).toEqual([
      "Add README",
      "Greet the world",
    ])
    expect(state.git.main).toBe(1)
    expect(state.jj.commits.map((c) => c.desc)).toEqual([
      "Add README",
      "Greet the world",
      "",
    ])
    expect(state.jj.main).toBe(0)
    expect(state.jj.head).toBe(2)
  })

  test("moving the bookmark puts it on the commit just described", () => {
    let state = reduce(initialState(content), { type: "commit" }, content)
    state = reduce(state, { type: "bookmark" }, content)

    expect(state.jj.main).toBe(1)
    expect(state.jj.commits[state.jj.main].desc).toBe("Greet the world")
    // Nothing left to move it to, so the button goes quiet.
    expect(allowed(state, { type: "bookmark" }, content)).toBe(false)
  })

  test("pushing makes what the remote holds immutable, and no more", () => {
    let state = reduce(initialState(content), { type: "commit" }, content)
    state = reduce(state, { type: "bookmark" }, content)
    state = reduce(state, { type: "push" }, content)

    expect(state.jj.commits.map((c) => c.immutable)).toEqual([
      true,
      true,
      false,
    ])
    expect(state.jj.remoteMain).toBe(1)
    // Git's copies of the same commits stay as rewritable as they were.
    expect(state.git.commits.every((c) => !c.immutable)).toBe(true)
    expect(state.git.remoteMain).toBe(1)
    expect(allowed(state, { type: "push" }, content)).toBe(false)
  })

  /**
   * The section's point arriving from the other direction: with the bookmark
   * left behind, `git push` sends the commit and
   * `jj git push --bookmark main` finds nothing to send.
   */
  test("a commit after a push leaves only Git with something to send", () => {
    let state = reduce(initialState(content), { type: "commit" }, content)
    state = reduce(state, { type: "bookmark" }, content)
    state = reduce(state, { type: "push" }, content)
    state = reduce(state, { type: "commit" }, content)

    expect(allowed(state, { type: "push" }, content)).toBe(true)

    const jjBefore = state.jj
    state = reduce(state, { type: "push" }, content)

    expect(state.last).toBe("pushGitOnly")
    expect(state.git.remoteMain).toBe(state.git.main)
    expect(state.jj).toBe(jjBefore)
  })

  test("commits run out with the descriptions", () => {
    let state = initialState(content)
    state = reduce(state, { type: "commit" }, content)
    state = reduce(state, { type: "commit" }, content)

    expect(allowed(state, { type: "commit" }, content)).toBe(false)
    expect(state.git.commits).toHaveLength(3)
  })

  test("rejects content with nothing to commit", () => {
    expect(() => initialState({ ...content, descs: [] })).toThrow("no descs")
  })
})

describe("rowsOf", () => {
  test("draws newest first, with the names that point at each commit", () => {
    const state = reduce(initialState(content), { type: "commit" }, content)

    expect(
      rowsOf(state.jj, content, true).map((row) => ({
        desc: row.desc,
        kind: row.kind,
        refs: row.refs.map((ref) => ref.label),
      })),
    ).toEqual([
      { desc: "(empty)", kind: "at", refs: ["@"] },
      { desc: "Greet the world", kind: "commit", refs: [] },
      { desc: "Add README", kind: "commit", refs: ["main"] },
    ])
    expect(
      rowsOf(state.git, content, false).map((row) =>
        row.refs.map((r) => r.label),
      ),
    ).toEqual([["HEAD", "main"], []])
  })

  test("a pushed commit is drawn as immutable and carries the remote's name", () => {
    let state = reduce(initialState(content), { type: "commit" }, content)
    state = reduce(state, { type: "bookmark" }, content)
    state = reduce(state, { type: "push" }, content)

    expect(
      rowsOf(state.jj, content, true).map((row) => [
        row.kind,
        ...row.refs.map((ref) => ref.label),
      ]),
    ).toEqual([
      ["at", "@"],
      ["immutable", "main", "origin/main"],
      ["immutable"],
    ])
  })
})
