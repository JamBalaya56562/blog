/**
 * The state behind the startup timeline: two measured starts of the same
 * stack, one where the app only waits for the database container to exist
 * and one where it waits for the database to answer, and what a request to
 * the app gets at any moment of either.
 *
 * Every time is in seconds from the moment the database began initialising,
 * as read off the containers' logs. A request made before the app listens
 * gets nothing; one made after it listens gets an error page until the app
 * has managed to reach the database, then the page it asked for.
 */

export type DbPhase = "starting" | "ready"
export type AppPhase = "down" | "up"
export type RequestResult = "none" | "error" | "ok"

export type Scenario = Readonly<{
  label: string
  /** When the database first accepts connections. */
  dbReady: number
  /** When the app starts listening. */
  appListening: number
  /** From when a request gets the page rather than an error. */
  appWorks: number
  /** Moments worth a mark on the timeline, with what happened. */
  events: readonly Readonly<{ at: number; label: string }>[]
}>

export type StartupTimelineContent = Readonly<{
  scenarios: readonly Scenario[]
  /** The right-hand end of the timeline, in seconds. */
  end: number
  labels: Readonly<{
    scenario: string
    time: string
    db: string
    app: string
    request: string
    dbPhase: Readonly<Record<DbPhase, string>>
    appPhase: Readonly<Record<AppPhase, string>>
    result: Readonly<Record<RequestResult, string>>
  }>
  /** Spoken as the reader moves; may use `{t}`, `{db}`, `{app}`, `{request}`. */
  status: string
}>

export type StartupTimelineState = Readonly<{ scenario: number; t: number }>

export type StartupTimelineAction =
  | { type: "scenario"; index: number }
  | { type: "time"; t: number }
  | { type: "reset" }

/** The slider moves in quarter seconds: finer than any gap measured here. */
export const STEP = 0.25

export function initialState(
  content: StartupTimelineContent,
): StartupTimelineState {
  if (content.scenarios.length === 0) {
    throw new Error("StartupTimeline: no scenarios")
  }
  for (const s of content.scenarios) {
    const times = [
      s.dbReady,
      s.appListening,
      s.appWorks,
      ...s.events.map((e) => e.at),
    ]
    if (times.some((t) => !(t >= 0 && t <= content.end))) {
      throw new Error(
        `StartupTimeline: ${s.label} has a time outside 0..${content.end}`,
      )
    }
    if (s.appWorks < s.appListening) {
      throw new Error(`StartupTimeline: ${s.label} works before it listens`)
    }
    if (s.appWorks < s.dbReady) {
      throw new Error(
        `StartupTimeline: ${s.label} works before the database is ready`,
      )
    }
  }
  // The served picture is the first scenario at the moment its lesson shows:
  // the database is ready and the app is up, yet a request still fails.
  const first = content.scenarios[0]
  return {
    scenario: 0,
    t: snap((first.dbReady + first.appWorks) / 2, content.end),
  }
}

function snap(t: number, end: number): number {
  return Math.min(end, Math.max(0, Math.round(t / STEP) * STEP))
}

export function reduce(
  state: StartupTimelineState,
  action: StartupTimelineAction,
  content: StartupTimelineContent,
): StartupTimelineState {
  switch (action.type) {
    case "reset":
      return initialState(content)
    case "scenario":
      if (
        !Number.isInteger(action.index) ||
        action.index < 0 ||
        action.index >= content.scenarios.length
      ) {
        return state
      }
      return { ...state, scenario: action.index }
    case "time":
      if (!Number.isFinite(action.t)) {
        return state
      }
      return { ...state, t: snap(action.t, content.end) }
  }
}

export function at(
  scenario: Scenario,
  t: number,
): Readonly<{ db: DbPhase; app: AppPhase; request: RequestResult }> {
  return {
    app: t < scenario.appListening ? "down" : "up",
    db: t < scenario.dbReady ? "starting" : "ready",
    request:
      t < scenario.appListening
        ? "none"
        : t < scenario.appWorks
          ? "error"
          : "ok",
  }
}

export type Segment<P> = Readonly<{ from: number; to: number; phase: P }>

/** A lane as the spans it is drawn with, left to right, empty spans dropped. */
export function lanes(
  scenario: Scenario,
  end: number,
): Readonly<{
  db: readonly Segment<DbPhase>[]
  app: readonly Segment<AppPhase>[]
  request: readonly Segment<RequestResult>[]
}> {
  const spans = <P>(cuts: readonly (readonly [number, P])[]): Segment<P>[] =>
    cuts
      .map(([from, phase], index) => ({
        from,
        phase,
        to: index + 1 < cuts.length ? cuts[index + 1][0] : end,
      }))
      .filter((s) => s.to > s.from)
  return {
    app: spans<AppPhase>([
      [0, "down"],
      [scenario.appListening, "up"],
    ]),
    db: spans<DbPhase>([
      [0, "starting"],
      [scenario.dbReady, "ready"],
    ]),
    request: spans<RequestResult>([
      [0, "none"],
      [scenario.appListening, "error"],
      [scenario.appWorks, "ok"],
    ]),
  }
}

export function isInitial(
  state: StartupTimelineState,
  content: StartupTimelineContent,
): boolean {
  const initial = initialState(content)
  return state.scenario === initial.scenario && state.t === initial.t
}
