import { describe, expect, test } from "bun:test"
import fc from "fast-check"
import {
  derive,
  initialState,
  isInitial,
  type OrderedRunAction,
  type OrderedRunContent,
  reduce,
} from "@/lib/explorables/ordered-run"

const labels = {
  down: "down {line}",
  lines: "lines",
  outcome: "outcome",
  state: {
    failed: "failed",
    overridden: "overridden",
    ran: "ran",
    skipped: "skipped",
    wins: "wins",
  },
  up: "up {line}",
}

/** The article's `[env]`: two lines that set the same key. */
const env: OrderedRunContent = {
  labels,
  lines: [
    { text: 'SHARED = "from-mise-toml"', value: "from-mise-toml" },
    { text: '_.file = ".env"', value: "from-dotenv" },
  ],
  rule: "lastWins",
  status: "{outcome}",
}

/** The article's `run` array: three steps, the middle one failing. */
const run: OrderedRunContent = {
  labels,
  lines: [
    { text: "echo step1" },
    { fails: true, text: "false" },
    { text: "echo step3" },
  ],
  rule: "stopOnFail",
  status: "{outcome}",
}

const actions = (content: OrderedRunContent) =>
  fc.array(
    fc.oneof(
      fc.record({
        position: fc.integer({ max: content.lines.length, min: -1 }),
        type: fc.constantFrom("up" as const, "down" as const),
      }),
      fc.constant<OrderedRunAction>({ type: "reset" }),
    ),
    { maxLength: 12 },
  )

const play = (content: OrderedRunContent, list: readonly OrderedRunAction[]) =>
  list.reduce((s, a) => reduce(s, a, content), initialState(content))

describe("ordered run", () => {
  test("Property 1: moving lines never loses or repeats one", () => {
    fc.assert(
      fc.property(actions(run), (list) => {
        const { order } = play(run, list)
        expect([...order].sort()).toEqual([0, 1, 2])
      }),
      { numRuns: 300 },
    )
  })

  /** The article's rule: applied top to bottom, the last setter survives. */
  test("Property 2: the value that wins is the lowest line that sets one", () => {
    fc.assert(
      fc.property(actions(env), (list) => {
        const state = play(env, list)
        const view = derive(state, env)
        const lowest = state.order.at(-1) as number
        expect(view.outcome).toBe(env.lines[lowest].value ?? null)
        expect(view.rows.at(-1)?.state).toBe("wins")
      }),
      { numRuns: 300 },
    )
  })

  test("Property 3: exactly one line wins", () => {
    fc.assert(
      fc.property(actions(env), (list) => {
        const { rows } = derive(play(env, list), env)
        expect(rows.filter((row) => row.state === "wins")).toHaveLength(1)
      }),
      { numRuns: 300 },
    )
  })

  /** Nothing below a failure runs, and everything above it did. */
  test("Property 4: a run is ran*, then failed, then skipped*", () => {
    fc.assert(
      fc.property(actions(run), (list) => {
        const { rows } = derive(play(run, list), run)
        const failed = rows.findIndex((row) => row.state === "failed")
        expect(failed).toBeGreaterThan(-1)
        expect(rows.slice(0, failed).every((r) => r.state === "ran")).toBe(true)
        expect(rows.slice(failed + 1).every((r) => r.state === "skipped")).toBe(
          true,
        )
      }),
      { numRuns: 300 },
    )
  })

  test("Property 5: the count is how many lines were reached", () => {
    fc.assert(
      fc.property(actions(run), (list) => {
        const view = derive(play(run, list), run)
        const reached = view.rows.filter(
          (row) => row.state !== "skipped",
        ).length
        expect(view.outcome).toBe(String(reached))
      }),
      { numRuns: 300 },
    )
  })

  test("Property 6: reset returns to the file as written", () => {
    fc.assert(
      fc.property(actions(env), (list) => {
        const back = reduce(play(env, list), { type: "reset" }, env)
        expect(back).toEqual(initialState(env))
        expect(isInitial(back, env)).toBe(true)
      }),
      { numRuns: 300 },
    )
  })

  /** Both transcripts the article prints for the same two lines. */
  test("matches the article's env transcripts", () => {
    expect(derive(initialState(env), env).outcome).toBe("from-dotenv")

    const swapped = reduce(
      initialState(env),
      { position: 0, type: "down" },
      env,
    )
    expect(derive(swapped, env).outcome).toBe("from-mise-toml")
    expect(derive(swapped, env).rows.map((row) => row.state)).toEqual([
      "overridden",
      "wins",
    ])
  })

  /** "2 行目の false で失敗したので、そこで打ち切られています". */
  test("matches the article's task transcript", () => {
    const view = derive(initialState(run), run)
    expect(view.rows.map((row) => row.state)).toEqual([
      "ran",
      "failed",
      "skipped",
    ])
    expect(view.outcome).toBe("2")
  })

  /** The point of the IMPORTANT note: put the failing step last. */
  test("moving the failure to the end lets everything run", () => {
    let state = initialState(run)
    state = reduce(state, { position: 1, type: "down" }, run)
    const view = derive(state, run)

    expect(view.rows.map((row) => row.text)).toEqual([
      "echo step1",
      "echo step3",
      "false",
    ])
    expect(view.rows.map((row) => row.state)).toEqual(["ran", "ran", "failed"])
    expect(view.outcome).toBe("3")
  })

  test("a move that goes nowhere is the same state", () => {
    const state = initialState(run)
    expect(reduce(state, { position: 0, type: "up" }, run)).toBe(state)
    expect(reduce(state, { position: 2, type: "down" }, run)).toBe(state)
    expect(reduce(state, { position: 9, type: "up" }, run)).toBe(state)
  })

  test("rejects content the rule cannot act on", () => {
    expect(() => initialState({ ...env, lines: [env.lines[0]] })).toThrow(
      "at least two lines",
    )
    expect(() =>
      initialState({
        ...env,
        lines: [{ text: "a" }, { text: "b" }],
      }),
    ).toThrow("lastWins needs a line that sets a value")
    expect(() =>
      initialState({
        ...run,
        lines: [{ text: "a" }, { text: "b" }],
      }),
    ).toThrow("stopOnFail needs a line that fails")
  })
})
