import { describe, expect, test } from "bun:test"
import fc from "fast-check"
import {
  type BuildContextAction,
  type BuildContextContent,
  derive,
  excludes,
  initialState,
  isInitial,
  reduce,
} from "@/lib/explorables/build-context"

/** The directory the picture showed, and the repository's own ignore file. */
const content: BuildContextContent = {
  entries: [
    { name: "Dockerfile" },
    { name: "index.html" },
    { name: "node_modules", note: "手元の依存" },
    { name: "packages/core/node_modules" },
    { name: ".git" },
  ],
  ignore: ["node_modules", "**/node_modules", "**/dist", ".git", ".github"],
  labels: {
    directory: "directory",
    excludedState: "kept out by {pattern}",
    ignore: "ignore",
    sent: "sent",
    sentState: "sent",
  },
  status: "{sent}/{total}",
}

const action = fc.oneof(
  fc.record({
    pattern: fc.constantFrom(...content.ignore, "not-a-line"),
    type: fc.constant("toggle" as const),
  }),
  fc.constant<BuildContextAction>({ type: "reset" }),
)
const actions = fc.array(action, { maxLength: 12 })
const play = (list: readonly BuildContextAction[]) =>
  list.reduce((s, a) => reduce(s, a, content), initialState(content))

describe("build context", () => {
  test("Property 1: the active lines are always lines of the file", () => {
    fc.assert(
      fc.property(actions, (list) => {
        const { active } = play(list)
        expect(active.every((line) => content.ignore.includes(line))).toBe(true)
        expect(new Set(active).size).toBe(active.length)
      }),
      { numRuns: 300 },
    )
  })

  /** The file's order is the file's order, however the reader toggles. */
  test("Property 2: the lines keep the order the file has them in", () => {
    fc.assert(
      fc.property(actions, (list) => {
        const { active } = play(list)
        expect(active).toEqual(content.ignore.filter((l) => active.includes(l)))
      }),
      { numRuns: 300 },
    )
  })

  /** Turning a line off can only ever send more, never less. */
  test("Property 3: switching a line off never sends fewer entries", () => {
    fc.assert(
      fc.property(actions, fc.constantFrom(...content.ignore), (list, line) => {
        const before = play(list)
        if (!before.active.includes(line)) {
          return
        }
        const after = reduce(before, { pattern: line, type: "toggle" }, content)
        expect(derive(after, content).sent).toBeGreaterThanOrEqual(
          derive(before, content).sent,
        )
      }),
      { numRuns: 300 },
    )
  })

  test("Property 4: an entry is excluded by a line that is switched on", () => {
    fc.assert(
      fc.property(actions, (list) => {
        const state = play(list)
        for (const row of derive(state, content).rows) {
          if (row.excludedBy === null) {
            continue
          }
          expect(state.active).toContain(row.excludedBy)
          expect(excludes(row.excludedBy, row.name)).toBe(true)
        }
      }),
      { numRuns: 300 },
    )
  })

  test("Property 5: reset returns to the file as written", () => {
    fc.assert(
      fc.property(actions, (list) => {
        const back = reduce(play(list), { type: "reset" }, content)
        expect(back).toEqual(initialState(content))
        expect(isInitial(back, content)).toBe(true)
      }),
      { numRuns: 300 },
    )
  })

  /** What the picture this replaces showed: two of the four things cross. */
  test("keeps out what the repository's ignore file keeps out", () => {
    const view = derive(initialState(content), content)
    expect(
      view.rows.map((row) => `${row.name}:${row.excludedBy ?? "sent"}`),
    ).toEqual([
      "Dockerfile:sent",
      "index.html:sent",
      "node_modules:node_modules",
      "packages/core/node_modules:node_modules",
      ".git:.git",
    ])
    expect(view.sent).toBe(2)
    expect(view.total).toBe(5)
  })

  /**
   * A globstar matches no directories as happily as it matches several, so
   * `**` + `/node_modules` covers the one at the top too: switching the bare
   * line off changes nothing while the other is still on. The two lines in
   * that file overlap, and the figure shows which one did the work.
   */
  test("a line that another line covers keeps its entry out anyway", () => {
    const one = reduce(
      initialState(content),
      { pattern: "node_modules", type: "toggle" },
      content,
    )
    expect(
      derive(one, content).rows.map(
        (row) => `${row.name}:${row.excludedBy ?? "sent"}`,
      ),
    ).toEqual([
      "Dockerfile:sent",
      "index.html:sent",
      "node_modules:**/node_modules",
      "packages/core/node_modules:**/node_modules",
      ".git:.git",
    ])
    expect(derive(one, content).sent).toBe(2)
  })

  test("switching both lines off puts the dependencies back on the wire", () => {
    const both = ["node_modules", "**/node_modules"].reduce(
      (state, pattern) => reduce(state, { pattern, type: "toggle" }, content),
      initialState(content),
    )
    const view = derive(both, content)

    expect(
      view.rows.map((row) => `${row.name}:${row.excludedBy ?? "sent"}`),
    ).toEqual([
      "Dockerfile:sent",
      "index.html:sent",
      "node_modules:sent",
      "packages/core/node_modules:sent",
      ".git:.git",
    ])
    expect(view.sent).toBe(4)
  })

  test("a line that matches nothing here changes nothing", () => {
    const before = derive(initialState(content), content)
    const after = derive(
      reduce(
        initialState(content),
        { pattern: ".github", type: "toggle" },
        content,
      ),
      content,
    )
    expect(after.sent).toBe(before.sent)
  })

  describe("excludes", () => {
    test("matches a name, at the top or nested", () => {
      expect(excludes("node_modules", "node_modules")).toBe(true)
      expect(excludes("**/node_modules", "packages/core/node_modules")).toBe(
        true,
      )
      expect(excludes("node_modules", "packages/core/node_modules")).toBe(true)
    })

    test("does not match a name that merely contains it", () => {
      expect(excludes("dist", "distribution")).toBe(false)
      expect(excludes("dist", "my_dist")).toBe(false)
      expect(excludes(".git", ".github")).toBe(false)
    })
  })

  test("rejects content it cannot filter", () => {
    expect(() => initialState({ ...content, entries: [] })).toThrow(
      "no entries",
    )
    expect(() => initialState({ ...content, ignore: [] })).toThrow(
      "no ignore lines",
    )
    expect(() => initialState({ ...content, initialOff: ["nope"] })).toThrow(
      '"nope" is not an ignore line',
    )
  })
})
