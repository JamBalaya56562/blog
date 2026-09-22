import { describe, expect, test } from "bun:test"
import fc from "fast-check"
import {
  type CommitGraphAction,
  type CommitGraphContent,
  initialState,
  isInitial,
  reduce,
  rowsOf,
} from "@/lib/explorables/commit-graph"

/** The squash figure, written from the article's own transcripts. */
const content: CommitGraphContent = {
  labels: {
    added: "new",
    graph: "jj log",
    next: "forward",
    previous: "back",
    rewritten: "new commit ID",
    step: "step",
  },
  scenes: [
    {
      caption: "before",
      command: "jj log",
      rows: [
        {
          changeId: "ovvvnnor",
          desc: "Add a licence note",
          kind: "at",
        },
        {
          changeId: "oklvxylu",
          commitId: "bf873b9b",
          desc: "Greet the world",
          kind: "commit",
        },
        {
          changeId: "tturtmot",
          commitId: "4bb47a91",
          desc: "Add README",
          kind: "commit",
        },
      ],
    },
    {
      caption: "after",
      command: "jj squash README.md",
      rows: [
        {
          changeId: "ovvvnnor",
          commitId: "5e6ce646",
          desc: "Add a licence note",
          kind: "at",
        },
        {
          changeId: "oklvxylu",
          commitId: "901a7c31",
          desc: "Greet the world",
          kind: "commit",
        },
        {
          changeId: "tturtmot",
          commitId: "4bb47a91",
          desc: "Add README",
          kind: "commit",
        },
      ],
    },
    {
      caption: "and again",
      command: "jj edit tturtmot",
      rows: [
        {
          changeId: "ovvvnnor",
          commitId: "5e6ce646",
          desc: "Add a licence note",
          kind: "commit",
        },
        {
          changeId: "oklvxylu",
          commitId: "901a7c31",
          desc: "Greet the world",
          kind: "commit",
        },
        {
          changeId: "tturtmot",
          commitId: "2610b68f",
          desc: "Add README",
          kind: "at",
        },
        {
          changeId: "newone",
          commitId: "00000000",
          desc: "A row that was not there",
          kind: "commit",
        },
      ],
    },
  ],
  status: "{n}/{total} · {command} — {caption}",
}

const action = fc.oneof(
  fc.record({
    to: fc.integer({ max: 5, min: -2 }),
    type: fc.constant("step" as const),
  }),
  fc.constantFrom<CommitGraphAction>(
    { type: "previous" },
    { type: "next" },
    { type: "reset" },
  ),
)
const actions = fc.array(action, { maxLength: 12 })

const run = (list: readonly CommitGraphAction[]) =>
  list.reduce((s, a) => reduce(s, a, content), initialState(content))

describe("commit graph", () => {
  test("Property 1: the step never leaves the scenes", () => {
    fc.assert(
      fc.property(actions, (list) => {
        const { step } = run(list)
        expect(step).toBeGreaterThanOrEqual(0)
        expect(step).toBeLessThan(content.scenes.length)
        expect(Number.isInteger(step)).toBe(true)
      }),
      { numRuns: 300 },
    )
  })

  test("Property 2: back and forward undo each other in the middle", () => {
    fc.assert(
      fc.property(actions, (list) => {
        const state = run(list)
        if (state.step === 0 || state.step === content.scenes.length - 1) {
          return
        }
        expect(
          reduce(
            reduce(state, { type: "next" }, content),
            { type: "previous" },
            content,
          ),
        ).toEqual(state)
      }),
      { numRuns: 300 },
    )
  })

  /**
   * Whatever step the reader is on, the rows are that scene's rows in that
   * scene's order: stepping never rearranges a transcript.
   */
  test("Property 3: the rows are the scene's rows, in order", () => {
    fc.assert(
      fc.property(actions, (list) => {
        const { step } = run(list)
        expect(rowsOf(content, step).map((row) => row.key)).toEqual(
          content.scenes[step].rows.map((row) => row.changeId),
        )
      }),
      { numRuns: 300 },
    )
  })

  test("Property 4: reset returns to the first step", () => {
    fc.assert(
      fc.property(actions, (list) => {
        const back = reduce(run(list), { type: "reset" }, content)
        expect(back).toEqual({ step: 0 })
        expect(isInitial(back)).toBe(true)
      }),
      { numRuns: 300 },
    )
  })

  /**
   * The mark is the whole point of the figure: a commit that kept its change
   * ID while its commit ID moved is what these sections are about, and the
   * article cannot get it wrong because it does not write it.
   */
  test("marks a row whose commit ID moved, and only that row", () => {
    expect(
      rowsOf(content, 1).map((row) => [row.desc, row.mark, row.commitId]),
    ).toEqual([
      // A hash that was not printed before and is printed now is a hash
      // that moved: the reader is looking at a different commit.
      ["Add a licence note", "rewritten", "5e6ce646"],
      ["Greet the world", "rewritten", "901a7c31"],
      ["Add README", "same", "4bb47a91"],
    ])
  })

  /**
   * Some rewrites the article states in prose without printing a hash — the
   * descendants a rebase carries along. Those rows say so themselves, and it
   * is the only label the article is allowed to set.
   */
  test("marks a row the scene declares rewritten", () => {
    const declared: CommitGraphContent = {
      ...content,
      scenes: [
        {
          caption: "before",
          command: "jj log",
          rows: [{ changeId: "a", desc: "carried along", kind: "commit" }],
        },
        {
          caption: "after",
          command: "jj edit b",
          rows: [
            {
              changeId: "a",
              desc: "carried along",
              kind: "commit",
              rewritten: true,
            },
          ],
        },
      ],
    }
    expect(rowsOf(declared, 1)[0].mark).toBe("rewritten")
    expect(rowsOf(declared, 0)[0].mark).toBe("same")
  })

  /** The mark is also words, for a reader who does not get the colour. */
  test("gives each mark its label", () => {
    expect(rowsOf(content, 1).map((row) => row.markLabel)).toEqual([
      "new commit ID",
      "new commit ID",
      undefined,
    ])
    expect(
      rowsOf(content, 2).find((row) => row.mark === "added")?.markLabel,
    ).toBe("new")
  })

  test("marks a row that was not in the step before", () => {
    const marks = rowsOf(content, 2).map((row) => [row.desc, row.mark])
    expect(marks).toContainEqual(["A row that was not there", "added"])
    expect(marks).toContainEqual(["Add README", "rewritten"])
    expect(marks).toContainEqual(["Greet the world", "same"])
  })

  /** Nothing has changed yet on the first step, so nothing is marked. */
  test("marks nothing on the first step", () => {
    expect(rowsOf(content, 0).every((row) => row.mark === "same")).toBe(true)
  })

  test("carries the row's own fields through", () => {
    const forked: CommitGraphContent = {
      ...content,
      scenes: [
        content.scenes[0],
        {
          caption: "fetched",
          command: "jj git fetch",
          rows: [
            {
              changeId: "upwouywx",
              commitId: "0be7156b",
              desc: "Add contributing guide",
              kind: "at",
            },
            {
              changeId: "zumzptvl",
              commitId: "eccc91c7",
              desc: "Add the copyright line",
              kind: "immutable",
              lane: 1,
              refs: [{ kind: "bookmark", label: "main" }],
              rejoins: true,
            },
          ],
        },
      ],
    }
    expect(rowsOf(forked, 1)[1]).toEqual({
      commitId: "eccc91c7",
      desc: "Add the copyright line",
      key: "zumzptvl",
      kind: "immutable",
      lane: 1,
      mark: "added",
      markLabel: "new",
      note: undefined,
      refs: [{ kind: "bookmark", label: "main" }],
      rejoins: true,
    })
  })

  test("rejects content it cannot step through", () => {
    expect(() =>
      initialState({ ...content, scenes: [content.scenes[0]] }),
    ).toThrow("at least two scenes")
    expect(() =>
      initialState({
        ...content,
        scenes: [
          content.scenes[0],
          { caption: "c", command: "empty", rows: [] },
        ],
      }),
    ).toThrow('scene "empty" has no rows')
    expect(() =>
      initialState({
        ...content,
        scenes: [
          content.scenes[0],
          {
            caption: "c",
            command: "twice",
            rows: [
              { changeId: "a", desc: "one", kind: "commit" },
              { changeId: "a", desc: "two", kind: "commit" },
            ],
          },
        ],
      }),
    ).toThrow('scene "twice" repeats a change ID')
  })

  test("a step that goes nowhere is the same state", () => {
    const state = initialState(content)
    expect(reduce(state, { to: 0, type: "step" }, content)).toBe(state)
    expect(reduce(state, { to: 9, type: "step" }, content)).toBe(state)
    expect(reduce(state, { to: -1, type: "step" }, content)).toBe(state)
    expect(reduce(state, { type: "previous" }, content)).toBe(state)
  })
})
