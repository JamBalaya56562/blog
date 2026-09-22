import { afterEach, describe, expect, test } from "bun:test"
import { act, cleanup, fireEvent, render } from "@testing-library/react"
import { OrderedRun } from "@/components/explorables/ordered-run"
import type { OrderedRunContent } from "@/lib/explorables/ordered-run"

afterEach(cleanup)

const labels = {
  down: "下へ: {line}",
  lines: "mise.toml",
  outcome: "結果",
  state: {
    failed: "ここで失敗",
    overridden: "上書きされた",
    ran: "実行された",
    skipped: "実行されない",
    wins: "これが残る",
  },
  up: "上へ: {line}",
}

const env: Pick<OrderedRunContent, "rule" | "lines"> = {
  lines: [
    { text: 'SHARED = "from-mise-toml"', value: "from-mise-toml" },
    { text: '_.file = ".env"', value: "from-dotenv" },
  ],
  rule: "lastWins",
}

const run: Pick<OrderedRunContent, "rule" | "lines"> = {
  lines: [
    { text: "echo step1" },
    { fails: true, text: "false" },
    { text: "echo step3" },
  ],
  rule: "stopOnFail",
}

function renderFigure(content = env) {
  return render(
    <OrderedRun
      caption="順番で結果が変わる"
      hint="行を動かしてみてください"
      labels={labels}
      lines={content.lines}
      rule={content.rule}
      status="export SHARED={outcome}"
      title="mise.toml"
    />,
  )
}

const rows = (container: HTMLElement) =>
  [...container.querySelectorAll<HTMLElement>(".pp-explorable-row")].map(
    (row) =>
      `${row.dataset.lineState}:${row.querySelector(".pp-explorable-cmdtext")?.textContent}`,
  )

const outcome = (container: HTMLElement) =>
  container.querySelector(".pp-explorable-outcome")?.textContent

const moveDown = (container: HTMLElement, position: number) => {
  const button = container
    .querySelectorAll(".pp-explorable-row")
    [position].querySelector<HTMLButtonElement>('[data-move="down"]')
  if (!button) {
    throw new Error(`no down button at ${position}`)
  }
  fireEvent.click(button)
}

describe("OrderedRun", () => {
  /** The served state is the file as the article writes it. */
  test("renders the env file and the value it exports", () => {
    const { container, getByText } = renderFigure()

    expect(rows(container)).toEqual([
      'overridden:SHARED = "from-mise-toml"',
      'wins:_.file = ".env"',
    ])
    expect(outcome(container)).toBe("from-dotenv")
    expect(getByText("export SHARED=from-dotenv")).toBeDefined()
  })

  /** The article's second transcript: swap the lines, swap the value. */
  test("moving a line moves the value that wins", async () => {
    const { container } = renderFigure()

    await act(async () => {
      moveDown(container, 0)
    })

    expect(rows(container)).toEqual([
      'overridden:_.file = ".env"',
      'wins:SHARED = "from-mise-toml"',
    ])
    expect(outcome(container)).toBe("from-mise-toml")
  })

  test("renders a run array stopping at the failure", () => {
    const { container } = renderFigure(run)

    expect(rows(container)).toEqual([
      "ran:echo step1",
      "failed:false",
      "skipped:echo step3",
    ])
    expect(outcome(container)).toBe("2")
  })

  /** The IMPORTANT note, tried: put the failing step last and all run. */
  test("moving the failure down lets the step below it run", async () => {
    const { container } = renderFigure(run)

    await act(async () => {
      moveDown(container, 1)
    })

    expect(rows(container)).toEqual([
      "ran:echo step1",
      "ran:echo step3",
      "failed:false",
    ])
    expect(outcome(container)).toBe("3")
  })

  /**
   * The row moved out from under the pointer, so focus follows the line to
   * its new place rather than falling to the document.
   */
  test("focus follows the line that moved", async () => {
    const { container } = renderFigure(run)

    await act(async () => {
      moveDown(container, 0)
    })

    const moved = container.querySelectorAll(".pp-explorable-row")[1]
    expect(moved.querySelector(".pp-explorable-cmdtext")?.textContent).toBe(
      "echo step1",
    )
    expect(document.activeElement).toBe(
      moved.querySelector('[data-move="down"]'),
    )
  })

  /**
   * The CSS tells the two list figures apart by this: only a list whose
   * rows carry controls gives its third column away to them.
   */
  test("marks itself as a list that can be reordered", () => {
    const { container } = renderFigure()

    expect(
      container
        .querySelector(".pp-explorable-lines")
        ?.getAttribute("data-reorder"),
    ).toBe("true")
  })

  test("the ends of the list disable the move that would fall off", () => {
    const { container } = renderFigure(run)
    const all = container.querySelectorAll(".pp-explorable-row")

    expect(
      all[0].querySelector<HTMLButtonElement>('[data-move="up"]')?.disabled,
    ).toBe(true)
    expect(
      all[2].querySelector<HTMLButtonElement>('[data-move="down"]')?.disabled,
    ).toBe(true)
  })

  test("each move button says which line it moves", () => {
    const { getByRole } = renderFigure()

    expect(
      getByRole("button", { name: '下へ: SHARED = "from-mise-toml"' }),
    ).toBeDefined()
  })

  test("reset returns to the file as written", async () => {
    const { container, getByRole } = renderFigure()
    const reset = getByRole("button", { name: "Reset" }) as HTMLButtonElement
    expect(reset.disabled).toBe(true)

    await act(async () => {
      moveDown(container, 0)
    })
    expect(reset.disabled).toBe(false)

    fireEvent.click(reset)
    expect(outcome(container)).toBe("from-dotenv")
    expect(reset.disabled).toBe(true)
  })

  test("throws when the rule has nothing to act on", () => {
    expect(() =>
      renderFigure({ lines: [{ text: "a" }, { text: "b" }], rule: "lastWins" }),
    ).toThrow("lastWins needs a line that sets a value")
  })
})
