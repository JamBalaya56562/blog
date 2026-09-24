import { afterEach, describe, expect, test } from "bun:test"
import { cleanup, fireEvent, render } from "@testing-library/react"
import { StartupTimeline } from "@/components/explorables/startup-timeline"

afterEach(cleanup)

function renderFigure() {
  return render(
    <StartupTimeline
      caption="Started is not ready"
      end={42}
      hint="Pick a start and drag through it"
      labels={{
        app: "EmDash",
        appPhase: { down: "not listening", up: "listening" },
        db: "PostgreSQL",
        dbPhase: { ready: "ready", starting: "initialising" },
        request: "request",
        result: { error: "error page", none: "no answer", ok: "the page" },
        scenario: "which start",
        time: "time",
      }}
      scenarios={[
        {
          appListening: 1.47,
          appWorks: 39.25,
          dbReady: 5.24,
          events: [
            { at: 3.22, label: "first request fails" },
            { at: 39.25, label: "recovered" },
          ],
          label: "depends_on only",
        },
        {
          appListening: 5.17,
          appWorks: 5.17,
          dbReady: 1.95,
          events: [{ at: 1.95, label: "database healthy" }],
          label: "with a healthcheck",
        },
      ]}
      status="{t} s: database {db}, app {app}, request gets {request}"
      title="docker compose up -d"
    />,
  )
}

const live = (container: HTMLElement) =>
  container.querySelector('.pp-explorable-status[aria-live="polite"]')
    ?.textContent

describe("StartupTimeline", () => {
  test("serves the moment the database is ready and a request still fails", () => {
    const { container } = renderFigure()
    expect(live(container)).toBe(
      "22.25 s: database ready, app listening, request gets error page",
    )
    const range = container.querySelector(
      "input[type=range]",
    ) as HTMLInputElement
    expect(range.value).toBe("22.25")
    expect(range.getAttribute("aria-valuetext")).toBe(live(container) ?? "")
  })

  test("the healthcheck start serves the page at the same moment", () => {
    const { container, getByRole } = renderFigure()
    const healthcheck = getByRole("button", { name: "with a healthcheck" })
    fireEvent.click(healthcheck)
    expect(healthcheck.getAttribute("aria-pressed")).toBe("true")
    expect(live(container)).toBe(
      "22.25 s: database ready, app listening, request gets the page",
    )
  })

  test("dragging to the start shows nothing answering yet", () => {
    const { container } = renderFigure()
    const range = container.querySelector(
      "input[type=range]",
    ) as HTMLInputElement
    fireEvent.change(range, { target: { value: "1" } })
    expect(live(container)).toBe(
      "1.00 s: database initialising, app not listening, request gets no answer",
    )
    const passed = [
      ...container.querySelectorAll(
        '.pp-explorable-events li[data-past="true"]',
      ),
    ]
    expect(passed).toHaveLength(0)
  })

  test("draws a cursor and one span per phase on every lane", () => {
    const { container } = renderFigure()
    const tracks = container.querySelectorAll(".pp-explorable-lane-track")
    expect(tracks).toHaveLength(3)
    const request = [...tracks[2].querySelectorAll(".pp-explorable-span")].map(
      (span) => (span as HTMLElement).dataset.phase,
    )
    expect(request).toEqual(["none", "error", "ok"])
    expect(tracks[0].querySelector(".pp-explorable-cursor")).not.toBeNull()
  })

  test("reset returns to the served moment", () => {
    const { container, getByRole } = renderFigure()
    fireEvent.click(getByRole("button", { name: "with a healthcheck" }))
    const reset = container.querySelector(
      ".pp-explorable-reset",
    ) as HTMLButtonElement
    fireEvent.click(reset)
    expect(live(container)).toContain("error page")
    expect(reset.disabled).toBe(true)
  })
})
