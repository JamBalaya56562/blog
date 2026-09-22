import { afterEach, describe, expect, test } from "bun:test"
import { cleanup, fireEvent, render } from "@testing-library/react"
import { CommitGraph } from "@/components/explorables/commit-graph"
import type { Scene } from "@/lib/explorables/commit-graph"

afterEach(cleanup)

const scenes: readonly Scene[] = [
  {
    caption: "the licence note is on top",
    command: "jj log",
    rows: [
      { changeId: "ovvvnnor", desc: "Add a licence note", kind: "at" },
      {
        changeId: "oklvxylu",
        commitId: "bf873b9b",
        desc: "Greet the world",
        kind: "commit",
      },
    ],
  },
  {
    caption: "the commit ID moved; the change ID did not",
    command: "jj squash README.md",
    rows: [
      {
        changeId: "ovvvnnor",
        desc: "Add a licence note",
        kind: "at",
        note: "restacked",
      },
      {
        changeId: "oklvxylu",
        commitId: "901a7c31",
        desc: "Greet the world",
        kind: "commit",
      },
    ],
  },
]

function renderFigure(list: readonly Scene[] = scenes) {
  return render(
    <CommitGraph
      caption="A change keeps its ID while its commit is rewritten"
      hint="Step through it"
      labels={{
        added: "new",
        graph: "jj log",
        next: "forward",
        previous: "back",
        rewritten: "new commit ID",
        step: "step",
      }}
      scenes={list}
      status="{n}/{total} · {command} — {caption}"
      title="jj squash"
    />,
  )
}

const rows = (container: HTMLElement) =>
  [...container.querySelectorAll(".pp-explorable-graph-row")].map((row) => ({
    mark: row.getAttribute("data-mark"),
    text: row.querySelector(".pp-explorable-graph-desc")?.textContent,
  }))

const slider = (container: HTMLElement) =>
  container.querySelector("input[type=range]") as HTMLInputElement

describe("CommitGraph", () => {
  /** The served markup is the first step: the state before the command. */
  test("renders the first scene as served", () => {
    const { container, getByText } = renderFigure()

    expect(rows(container)).toEqual([
      { mark: "same", text: "Add a licence note" },
      { mark: "same", text: "Greet the worldbf873b9b" },
    ])
    expect(getByText("jj log")).toBeDefined()
    expect(getByText("1/2 · jj log — the licence note is on top")).toBeDefined()
  })

  test("forward shows the next command and marks what it rewrote", () => {
    const { container, getByRole, getByText } = renderFigure()

    fireEvent.click(getByRole("button", { name: "forward" }))

    // The mark is in the row's words as well as its colour: "new commit ID"
    // between the description and the hash is the visually-hidden label.
    expect(rows(container)).toEqual([
      { mark: "same", text: "Add a licence noterestacked" },
      { mark: "rewritten", text: "Greet the worldnew commit ID901a7c31" },
    ])
    expect(
      container.querySelector("[data-mark=rewritten] .sr-only")?.textContent,
    ).toBe("new commit ID")
    expect(
      getByText(
        "2/2 · jj squash README.md — the commit ID moved; the change ID did not",
      ),
    ).toBeDefined()
  })

  test("the ends of the sequence disable their buttons", () => {
    const { getByRole } = renderFigure()
    const back = getByRole("button", { name: "back" }) as HTMLButtonElement
    const forward = getByRole("button", {
      name: "forward",
    }) as HTMLButtonElement

    expect(back.disabled).toBe(true)
    expect(forward.disabled).toBe(false)

    fireEvent.click(forward)
    expect(back.disabled).toBe(false)
    expect(forward.disabled).toBe(true)
  })

  /**
   * The slider is the same control as the buttons, and a screen reader hears
   * the command rather than a bare number.
   */
  test("the slider moves the step and says where it is", () => {
    const { container } = renderFigure()
    const range = slider(container)

    expect(range.getAttribute("aria-valuetext")).toBe("1/2 jj log")

    fireEvent.change(range, { target: { value: "1" } })
    expect(range.value).toBe("1")
    expect(range.getAttribute("aria-valuetext")).toBe("2/2 jj squash README.md")
  })

  test("reset returns to the first step", () => {
    const { container, getByRole } = renderFigure()
    const reset = getByRole("button", { name: "Reset" }) as HTMLButtonElement
    expect(reset.disabled).toBe(true)

    fireEvent.click(getByRole("button", { name: "forward" }))
    expect(reset.disabled).toBe(false)

    fireEvent.click(reset)
    expect(slider(container).value).toBe("0")
    expect(reset.disabled).toBe(true)
  })

  /** A fork needs the second lane, and only then. */
  test("widens the glyph column only when a scene forks", () => {
    const { container } = renderFigure()
    expect(
      container
        .querySelector(".pp-explorable-graph")
        ?.getAttribute("data-forked"),
    ).toBe("false")

    cleanup()
    const forked = renderFigure([
      scenes[0],
      {
        ...scenes[1],
        rows: [
          scenes[1].rows[0],
          { ...scenes[1].rows[1], lane: 1, rejoins: true },
        ],
      },
    ])
    fireEvent.click(forked.getByRole("button", { name: "forward" }))
    expect(
      forked.container
        .querySelector(".pp-explorable-graph")
        ?.getAttribute("data-forked"),
    ).toBe("true")
  })

  test("throws on a sequence with nothing to step through", () => {
    expect(() => renderFigure([scenes[0]])).toThrow("at least two scenes")
  })
})
