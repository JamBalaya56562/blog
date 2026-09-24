"use client"

import { useId, useReducer } from "react"
import { fill } from "@/lib/explorables/format"
import {
  at,
  initialState,
  isInitial,
  lanes,
  reduce,
  type Segment,
  STEP,
  type StartupTimelineAction,
  type StartupTimelineContent,
  type StartupTimelineState,
} from "@/lib/explorables/startup-timeline"
import { Explorable } from "./explorable"
import { Frame } from "./frame"

type Props = StartupTimelineContent &
  Readonly<{
    title: string
    hint?: string
    caption?: string
  }>

/** Seconds as the logs gave them: two decimals, never more. */
function seconds(t: number): string {
  return t.toFixed(2)
}

/**
 * Two measured starts of the same stack, and a request sent at any moment of
 * either.
 *
 * The reader picks a start and drags through it. Three lanes show what the
 * database, the app and a request to the app were doing, and the cursor is
 * the moment the sentence under them describes. The first start is served in
 * the middle of what it is here to show: the database has been ready for
 * seconds and the app is up, and a request still gets an error page.
 *
 * Every time comes from the article's logs, in seconds from when the database
 * began initialising; nothing here is simulated.
 */
export function StartupTimeline({ title, hint, caption, ...content }: Props) {
  const [state, dispatch] = useReducer(
    (current: StartupTimelineState, action: StartupTimelineAction) =>
      reduce(current, action, content),
    content,
    initialState,
  )
  const id = useId()
  const scenario = content.scenarios[state.scenario]
  const now = at(scenario, state.t)
  const drawn = lanes(scenario, content.end)

  function sentence(s: typeof scenario, t: number): string {
    const phase = at(s, t)
    return fill(content.status, {
      app: content.labels.appPhase[phase.app],
      db: content.labels.dbPhase[phase.db],
      request: content.labels.result[phase.request],
      t: seconds(t),
    })
  }
  /**
   * The sentence changes length with what it says, so every combination the
   * lanes can reach — one at each boundary — is laid out up front, with the
   * widest time in it.
   */
  const statuses = content.scenarios.flatMap((s) =>
    [0, s.dbReady, s.appListening, s.appWorks].map((boundary) =>
      sentence(s, boundary).replace(seconds(boundary), seconds(content.end)),
    ),
  )

  const percent = (t: number) => `${(t / content.end) * 100}%`
  const lane = <P extends string>(
    name: string,
    spans: readonly Segment<P>[],
  ) => (
    <div className="pp-explorable-lane">
      <span className="pp-explorable-lane-label">{name}</span>
      <span aria-hidden="true" className="pp-explorable-lane-track">
        {spans.map((span) => (
          <span
            className="pp-explorable-span"
            data-phase={span.phase}
            key={`${span.phase}-${span.from}`}
            style={
              {
                "--pp-explorable-from": percent(span.from),
                "--pp-explorable-to": percent(span.to),
              } as React.CSSProperties
            }
          />
        ))}
        <span
          className="pp-explorable-cursor"
          style={
            { "--pp-explorable-at": percent(state.t) } as React.CSSProperties
          }
        />
      </span>
    </div>
  )

  return (
    <Explorable
      caption={caption}
      hint={hint}
      onReset={() => dispatch({ type: "reset" })}
      pristine={isInitial(state, content)}
      status={sentence(scenario, state.t)}
      statuses={statuses}
      title={title}
    >
      <fieldset className="pp-explorable-controls">
        <legend className="sr-only">{content.labels.scenario}</legend>
        {content.scenarios.map((s, index) => (
          <button
            aria-pressed={index === state.scenario}
            className="pp-explorable-cmd"
            key={s.label}
            onClick={() => dispatch({ index, type: "scenario" })}
            type="button"
          >
            {s.label}
          </button>
        ))}
      </fieldset>

      <div className="pp-explorable-lanes">
        {lane(content.labels.db, drawn.db)}
        {lane(content.labels.app, drawn.app)}
        {lane(content.labels.request, drawn.request)}
      </div>
      {/* The three colours, named with the words the sentence already uses;
          grey is nothing yet and needs no key. */}
      <div aria-hidden="true" className="pp-explorable-legend">
        <span data-phase="starting">{content.labels.dbPhase.starting}</span>
        <span data-phase="error">{content.labels.result.error}</span>
        <span data-phase="ok">{content.labels.result.ok}</span>
      </div>

      <div className="pp-explorable-steps">
        <label className="pp-explorable-note" htmlFor={id}>
          {content.labels.time}
        </label>
        <input
          aria-valuetext={sentence(scenario, state.t)}
          className="pp-explorable-range"
          id={id}
          max={content.end}
          min={0}
          onChange={(event) =>
            dispatch({ t: Number(event.target.value), type: "time" })
          }
          step={STEP}
          type="range"
          value={state.t}
        />
        <output
          className="pp-explorable-badge"
          data-result={now.request}
          htmlFor={id}
        >
          {`${seconds(state.t)} s`}
        </output>
      </div>

      {/* Each start has its own marks; all of them are laid out, so switching
          between the starts moves nothing under the figure. */}
      <Frame
        active={state.scenario}
        panes={content.scenarios.map((s) => (
          <ol className="pp-explorable-events" key={s.label}>
            {[...s.events]
              .sort((a, b) => a.at - b.at)
              .map((event) => (
                <li
                  data-past={s === scenario && event.at <= state.t}
                  key={`${event.at}-${event.label}`}
                >
                  <span className="pp-explorable-badge">{`${seconds(event.at)} s`}</span>{" "}
                  {event.label}
                </li>
              ))}
          </ol>
        ))}
      />
    </Explorable>
  )
}
