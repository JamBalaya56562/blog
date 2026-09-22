import { describe, expect, test } from "bun:test"
import fc from "fast-check"
import {
  derive,
  initialState,
  isInitial,
  type LayerCacheAction,
  type LayerCacheContent,
  reduce,
} from "@/lib/explorables/layer-cache"

const labels = {
  cached: "CACHED",
  changed: "changed",
  order: "Order",
  rerun: "re-run",
  total: "total",
}
const status = { none: "none", some: "{cmd} {rerun} {time}" }

/** A Dockerfile of one to six steps with one to three arrangements of them. */
const content: fc.Arbitrary<LayerCacheContent> = fc
  .integer({ max: 6, min: 1 })
  .chain((length) => {
    const indices = Array.from({ length }, (_, i) => i)
    return fc.record({
      changed: fc.option(fc.integer({ max: length - 1, min: 0 }), {
        nil: null,
      }),
      labels: fc.constant(labels),
      orders: fc.array(
        fc.record({
          label: fc.string({ minLength: 1 }),
          order: fc.shuffledSubarray(indices, {
            maxLength: length,
            minLength: length,
          }),
        }),
        { maxLength: 3, minLength: 1 },
      ),
      status: fc.constant(status),
      steps: fc.array(
        fc.record({
          cmd: fc.string({ minLength: 1 }),
          note: fc.string(),
          seconds: fc.integer({ max: 1000, min: 0 }),
        }),
        { maxLength: length, minLength: length },
      ),
    })
  })

const action = (c: LayerCacheContent): fc.Arbitrary<LayerCacheAction> =>
  fc.oneof(
    fc.record({
      step: fc.integer({ max: c.steps.length - 1, min: 0 }),
      type: fc.constant("toggle" as const),
    }),
    fc.record({
      index: fc.integer({ max: c.orders.length - 1, min: 0 }),
      type: fc.constant("order" as const),
    }),
    fc.constant({ type: "reset" } as const),
  )

/** Content together with a sequence of actions that are valid for it. */
const scenario = content.chain((c) =>
  fc.tuple(fc.constant(c), fc.array(action(c), { maxLength: 12 })),
)

function run(c: LayerCacheContent, actions: readonly LayerCacheAction[]) {
  return actions.reduce((s, a) => reduce(s, a, c), initialState(c))
}

const RANK = { cached: 0, changed: 1, rerun: 2 } as const

describe("layer cache", () => {
  /**
   * The rule the article states: a step is reused only when it and everything
   * before it are unchanged. So the rows read cached, then at most one
   * changed, then re-run — never a cached row below a changed one.
   */
  test("Property 1: rows never go back to cached below a change", () => {
    fc.assert(
      fc.property(scenario, ([c, actions]) => {
        const { rows } = derive(run(c, actions), c)
        const ranks = rows.map((row) => RANK[row.state])
        for (let i = 1; i < ranks.length; i++) {
          expect(ranks[i]).toBeGreaterThanOrEqual(ranks[i - 1])
        }
        expect(
          rows.filter((row) => row.state === "changed").length,
        ).toBeLessThanOrEqual(1)
      }),
      { numRuns: 200 },
    )
  })

  test("Property 2: a rebuild never costs more than a build from nothing", () => {
    fc.assert(
      fc.property(scenario, ([c, actions]) => {
        const view = derive(run(c, actions), c)
        expect(view.seconds).toBeLessThanOrEqual(view.totalSeconds)
        expect(view.rerunCount).toBeLessThanOrEqual(view.rows.length)
      }),
      { numRuns: 200 },
    )
  })

  test("Property 3: with nothing changed, nothing runs", () => {
    fc.assert(
      fc.property(scenario, ([c, actions]) => {
        const state = run(c, actions)
        if (state.changed !== null) {
          return
        }
        const view = derive(state, c)
        expect(view.seconds).toBe(0)
        expect(view.rerunCount).toBe(0)
        expect(view.rows.every((row) => row.state === "cached")).toBe(true)
      }),
      { numRuns: 200 },
    )
  })

  test("Property 4: changing the first step re-runs the whole build", () => {
    fc.assert(
      fc.property(scenario, ([c, actions]) => {
        const state = run(c, actions)
        const first = c.orders[state.orderIndex].order[0]
        const view = derive({ ...state, changed: first }, c)
        expect(view.seconds).toBe(view.totalSeconds)
        expect(view.rerunCount).toBe(c.steps.length)
      }),
      { numRuns: 200 },
    )
  })

  /**
   * Reordering moves the steps around, it never loses or duplicates one: the
   * rows are always the arrangement the reader picked, step for step.
   */
  test("Property 5: rows follow the chosen arrangement exactly", () => {
    fc.assert(
      fc.property(scenario, ([c, actions]) => {
        const state = run(c, actions)
        const { rows } = derive(state, c)
        expect(rows.map((row) => row.step)).toEqual([
          ...c.orders[state.orderIndex].order,
        ])
        for (const row of rows) {
          expect(row.cmd).toBe(c.steps[row.step].cmd)
          expect(row.seconds).toBe(c.steps[row.step].seconds)
        }
      }),
      { numRuns: 200 },
    )
  })

  test("Property 6: reset returns to the served state, and only reset is initial", () => {
    fc.assert(
      fc.property(scenario, ([c, actions]) => {
        const afterReset = reduce(run(c, actions), { type: "reset" }, c)
        expect(afterReset).toEqual(initialState(c))
        expect(isInitial(afterReset, c)).toBe(true)
      }),
      { numRuns: 200 },
    )
  })

  test("Property 7: pressing the changed step again clears it", () => {
    fc.assert(
      fc.property(scenario, ([c, actions]) => {
        const state = run(c, actions)
        const step = state.changed ?? 0
        const once = reduce(state, { step, type: "toggle" }, c)
        const twice = reduce(once, { step, type: "toggle" }, c)
        // A press flips that one step between changed and not; the
        // arrangement is left alone.
        expect(once.changed).toBe(state.changed === step ? null : step)
        expect(twice.changed).toBe(state.changed === step ? step : null)
        expect(once.orderIndex).toBe(state.orderIndex)
      }),
      { numRuns: 200 },
    )
  })

  /**
   * Every post is prerendered, so a figure that cannot be drawn should fail
   * the build with a message naming the mistake, not render a blank.
   */
  test("rejects content that cannot be drawn", () => {
    const good: LayerCacheContent = {
      changed: 1,
      labels,
      orders: [{ label: "a", order: [0, 1] }],
      status,
      steps: [
        { cmd: "COPY a", note: "", seconds: 1 },
        { cmd: "RUN b", note: "", seconds: 2 },
      ],
    }
    expect(() => initialState(good)).not.toThrow()
    expect(() => initialState({ ...good, steps: [] })).toThrow("no steps")
    expect(() => initialState({ ...good, orders: [] })).toThrow("no orders")
    expect(() => initialState({ ...good, changed: 2 })).toThrow(
      "changed=2 but 2 steps",
    )
    expect(() =>
      initialState({ ...good, orders: [{ label: "dup", order: [0, 0] }] }),
    ).toThrow('order "dup" is not a permutation')
    expect(() =>
      initialState({ ...good, orders: [{ label: "short", order: [0] }] }),
    ).toThrow("not a permutation")
    expect(() =>
      initialState({
        ...good,
        steps: [good.steps[0], { cmd: "RUN b", note: "", seconds: -1 }],
      }),
    ).toThrow("bad duration for RUN b")
  })

  test("ignores an action that points outside the content", () => {
    const c: LayerCacheContent = {
      changed: null,
      labels,
      orders: [{ label: "a", order: [0] }],
      status,
      steps: [{ cmd: "COPY a", note: "", seconds: 1 }],
    }
    const state = initialState(c)
    expect(reduce(state, { step: 3, type: "toggle" }, c)).toBe(state)
    expect(reduce(state, { index: 1, type: "order" }, c)).toBe(state)
  })
})
