import { afterEach, describe, expect, test } from "bun:test"
import { cleanup, fireEvent, render } from "@testing-library/react"
import { LayerCache } from "@/components/explorables/layer-cache"

afterEach(cleanup)

const steps = [
  { cmd: "COPY pnpm-lock.yaml ./", note: "rarely", seconds: 1 },
  { cmd: "RUN pnpm install", note: "heavy", seconds: 330 },
  { cmd: "COPY . .", note: "daily", seconds: 4.5 },
  { cmd: "RUN pnpm build", note: "always after", seconds: 480 },
]

function renderFigure(changed: number | null = 2) {
  return render(
    <LayerCache
      caption="Put the stable steps first"
      changed={changed}
      hint="Click a line"
      labels={{
        cached: "CACHED",
        changed: "changed",
        order: "Order",
        rerun: "re-run",
        total: "Rebuild time",
      }}
      orders={[
        { label: "Lockfile first", order: [0, 1, 2, 3] },
        { label: "Sources first", order: [2, 0, 1, 3] },
      ]}
      status={{
        none: "Nothing changed",
        some: "{cmd} changed: {rerun} steps, {time}",
      }}
      steps={steps}
      title="Dockerfile"
    />,
  )
}

/** The step rows, in the order they are drawn. */
function rows(container: HTMLElement) {
  return [
    ...container.querySelectorAll<HTMLButtonElement>(".pp-explorable-row"),
  ]
}

const states = (container: HTMLElement) =>
  rows(container).map((row) => row.dataset.state)

describe("LayerCache", () => {
  /**
   * The served markup is the figure the static picture used to be: a change
   * at `COPY . .` with the two steps above it cached. A reader without
   * JavaScript, or before hydration, sees exactly that.
   */
  test("renders the state the props describe", () => {
    const { container, getByText } = renderFigure()

    expect(states(container)).toEqual(["cached", "cached", "changed", "rerun"])
    expect(container.textContent).toContain("CACHED")
    expect(container.textContent).toContain("DONE 4.5s")
    expect(container.textContent).toContain("DONE 480.0s")
    expect(getByText("COPY . . changed: 2 steps, 8m 5s")).toBeDefined()
    expect(container.textContent).toContain("8m 5s / 13m 36s")
  })

  test("pressing a step re-runs it and everything below", () => {
    const { container, getByText } = renderFigure()

    fireEvent.click(rows(container)[1])

    expect(states(container)).toEqual(["cached", "changed", "rerun", "rerun"])
    expect(rows(container)[1].getAttribute("aria-pressed")).toBe("true")
    expect(
      getByText("RUN pnpm install changed: 3 steps, 13m 35s"),
    ).toBeDefined()
  })

  test("pressing the changed step again leaves everything cached", () => {
    const { container, getByText } = renderFigure()

    fireEvent.click(rows(container)[2])

    expect(states(container)).toEqual(["cached", "cached", "cached", "cached"])
    expect(getByText("Nothing changed")).toBeDefined()
    expect(container.textContent).toContain("0s / 13m 36s")
  })

  /**
   * The second half of the article's argument: the same edit, with the
   * sources copied before the lockfile, throws away the install as well.
   */
  test("switching the arrangement moves the same change to a new position", () => {
    const { container, getByRole } = renderFigure()

    fireEvent.click(getByRole("button", { name: "Sources first" }))

    expect(rows(container).map((row) => row.textContent)).toEqual([
      expect.stringContaining("COPY . ."),
      expect.stringContaining("COPY pnpm-lock.yaml"),
      expect.stringContaining("RUN pnpm install"),
      expect.stringContaining("RUN pnpm build"),
    ])
    expect(states(container)).toEqual(["changed", "rerun", "rerun", "rerun"])
    expect(container.textContent).toContain("13m 36s / 13m 36s")
    expect(
      getByRole("button", { name: "Sources first" }).getAttribute(
        "aria-pressed",
      ),
    ).toBe("true")
    expect(
      getByRole("button", { name: "Lockfile first" }).getAttribute(
        "aria-pressed",
      ),
    ).toBe("false")
  })

  test("the bar carries the rebuild's share of the full build", () => {
    const { container } = renderFigure()

    const bar = container.querySelector<HTMLElement>(".pp-explorable-bar")
    const share = bar?.style.getPropertyValue("--pp-explorable-bar") ?? ""
    expect(Number.parseFloat(share)).toBeCloseTo((484.5 / 815.5) * 100, 3)
  })

  test("reset restores the served state and disables itself", () => {
    const { container, getByRole } = renderFigure()
    const reset = getByRole("button", { name: "Reset" }) as HTMLButtonElement
    expect(reset.disabled).toBe(true)

    fireEvent.click(rows(container)[0])
    expect(reset.disabled).toBe(false)

    fireEvent.click(reset)
    expect(states(container)).toEqual(["cached", "cached", "changed", "rerun"])
    expect(reset.disabled).toBe(true)
  })

  test("throws on props that cannot be drawn", () => {
    expect(() => renderFigure(7)).toThrow("changed=7 but 4 steps")
  })
})
