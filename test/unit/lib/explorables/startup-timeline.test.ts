import { describe, expect, test } from "bun:test"
import fc from "fast-check"
import {
  at,
  initialState,
  isInitial,
  lanes,
  reduce,
  STEP,
  type StartupTimelineAction,
  type StartupTimelineContent,
} from "@/lib/explorables/startup-timeline"

/** The two starts measured for the article, in seconds from the DB's init. */
const content: StartupTimelineContent = {
  end: 42,
  labels: {
    app: "EmDash",
    appPhase: { down: "not listening", up: "listening" },
    db: "PostgreSQL",
    dbPhase: { ready: "accepting connections", starting: "initialising" },
    request: "a request",
    result: { error: "error page", none: "no answer", ok: "the page" },
    scenario: "scenario",
    time: "time",
  },
  scenarios: [
    {
      appListening: 1.47,
      appWorks: 39.25,
      dbReady: 5.24,
      events: [{ at: 3.22, label: "first request: ECONNREFUSED" }],
      label: "depends_on only",
    },
    {
      appListening: 5.17,
      appWorks: 5.17,
      dbReady: 1.95,
      events: [],
      label: "with a healthcheck",
    },
  ],
  status: "{t}: {db}, {app}, {request}",
}

const [dependsOnly, healthcheck] = content.scenarios

const time = fc.double({ max: 60, min: -10, noNaN: true })
const actions = fc.array(
  fc.oneof(
    time.map((t): StartupTimelineAction => ({ t, type: "time" })),
    fc
      .integer({ max: 3, min: -1 })
      .map((index): StartupTimelineAction => ({ index, type: "scenario" })),
    fc.constant<StartupTimelineAction>({ type: "reset" }),
  ),
  { maxLength: 12 },
)
const play = (list: readonly StartupTimelineAction[]) =>
  list.reduce((s, a) => reduce(s, a, content), initialState(content))

describe("startup timeline", () => {
  test("Property 1: time stays on the timeline, in quarter seconds", () => {
    fc.assert(
      fc.property(actions, (list) => {
        const { t, scenario } = play(list)
        expect(t).toBeGreaterThanOrEqual(0)
        expect(t).toBeLessThanOrEqual(content.end)
        expect(Math.abs(t / STEP - Math.round(t / STEP))).toBeLessThan(1e-9)
        expect(content.scenarios[scenario]).toBeDefined()
      }),
      { numRuns: 300 },
    )
  })

  /** The picture and the sentence read the same moment the same way. */
  test("Property 2: every lane's span at t says what at(t) says", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...content.scenarios),
        fc.double({ max: 41.99, min: 0, noNaN: true }),
        (scenario, t) => {
          const drawn = lanes(scenario, content.end)
          const state = at(scenario, t)
          const phase = <P>(
            spans: readonly { from: number; to: number; phase: P }[],
          ) => spans.find((s) => s.from <= t && t < s.to)?.phase
          expect(phase(drawn.db)).toBe(state.db)
          expect(phase(drawn.app)).toBe(state.app)
          expect(phase(drawn.request)).toBe(state.request)
        },
      ),
      { numRuns: 300 },
    )
  })

  test("Property 3: each lane covers the timeline without gaps", () => {
    for (const scenario of content.scenarios) {
      for (const spans of Object.values(lanes(scenario, content.end))) {
        expect(spans[0].from).toBe(0)
        expect(spans.at(-1)?.to).toBe(content.end)
        spans.slice(1).forEach((span, index) => {
          expect(span.from).toBe(spans[index].to)
        })
      }
    }
  })

  /** A page is only ever served by an app that is up on a ready database. */
  test("Property 4: ok implies the database is ready and the app is up", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...content.scenarios),
        fc.double({ max: 42, min: 0, noNaN: true }),
        (scenario, t) => {
          const state = at(scenario, t)
          if (state.request === "ok") {
            expect(state.db).toBe("ready")
            expect(state.app).toBe("up")
          }
        },
      ),
      { numRuns: 300 },
    )
  })

  test("Property 5: reset returns to the served moment", () => {
    fc.assert(
      fc.property(actions, (list) => {
        const back = reduce(play(list), { type: "reset" }, content)
        expect(back).toEqual(initialState(content))
        expect(isInitial(back, content)).toBe(true)
      }),
      { numRuns: 300 },
    )
  })

  test("serves the moment the database is ready and the app still fails", () => {
    const state = initialState(content)
    expect(state.scenario).toBe(0)
    expect(at(dependsOnly, state.t)).toEqual({
      app: "up",
      db: "ready",
      request: "error",
    })
  })

  test("reads the measured starts the way the article tells them", () => {
    // depends_on only: the app listens before the database is ready, fails
    // its first request, and keeps failing long after the database is up.
    expect(at(dependsOnly, 1)).toEqual({
      app: "down",
      db: "starting",
      request: "none",
    })
    expect(at(dependsOnly, 3.22).request).toBe("error")
    expect(at(dependsOnly, 20)).toEqual({
      app: "up",
      db: "ready",
      request: "error",
    })
    expect(at(dependsOnly, 39.25).request).toBe("ok")
    // With a healthcheck the app is not started until the database answers,
    // and its first answer is the page.
    expect(at(healthcheck, 3)).toEqual({
      app: "down",
      db: "ready",
      request: "none",
    })
    expect(at(healthcheck, 5.17)).toEqual({
      app: "up",
      db: "ready",
      request: "ok",
    })
    expect(lanes(healthcheck, content.end).request.map((s) => s.phase)).toEqual(
      ["none", "ok"],
    )
  })

  test("ignores a scenario that does not exist", () => {
    const state = initialState(content)
    expect(reduce(state, { index: 5, type: "scenario" }, content)).toBe(state)
    expect(reduce(state, { index: 0.5, type: "scenario" }, content)).toBe(state)
    expect(reduce(state, { t: Number.NaN, type: "time" }, content)).toBe(state)
  })

  test("rejects timings that cannot have happened", () => {
    expect(() => initialState({ ...content, scenarios: [] })).toThrow(
      "no scenarios",
    )
    expect(() =>
      initialState({
        ...content,
        scenarios: [{ ...dependsOnly, appWorks: 1 }],
      }),
    ).toThrow("works before it listens")
    expect(() =>
      initialState({
        ...content,
        scenarios: [{ ...healthcheck, appListening: 1, appWorks: 1.5 }],
      }),
    ).toThrow("works before the database is ready")
    expect(() =>
      initialState({
        ...content,
        scenarios: [{ ...dependsOnly, appWorks: 50 }],
      }),
    ).toThrow("outside 0..42")
  })
})
