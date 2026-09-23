import { afterEach, describe, expect, test } from "bun:test"
import { cleanup, fireEvent, render } from "@testing-library/react"
import { BuildContext } from "@/components/explorables/build-context"

afterEach(cleanup)

function renderFigure() {
  return render(
    <BuildContext
      caption="COPY はここからしか取れない"
      entries={[
        { name: "Dockerfile" },
        { name: "index.html" },
        { name: "node_modules", note: "手元の依存" },
        { name: "packages/core/node_modules" },
        { name: ".git" },
      ]}
      hint="行を押すと外せます"
      ignore={["node_modules", "**/node_modules", "**/dist", ".git"]}
      labels={{
        directory: "手元のディレクトリ",
        excludedState: "{pattern} で除外",
        ignore: ".dockerignore",
        sent: "エンジンに届くもの",
        sentState: "送られる",
      }}
      status="{total} 件のうち {sent} 件が送られる"
      title="docker build ."
    />,
  )
}

/**
 * What a row says right now. Every reading its badge can take is in the
 * markup beside the live one and hidden — which is what keeps the row from
 * gaining a line when a longer pattern name takes over — so the query has
 * to ask for the reading that is showing.
 */
const badge = (row: HTMLElement) =>
  row.querySelector(
    '.pp-explorable-pane[data-active="true"] .pp-explorable-badge',
  )?.textContent

const rows = (container: HTMLElement) =>
  [...container.querySelectorAll<HTMLElement>(".pp-explorable-row")].map(
    (row) =>
      `${row.dataset.lineState}:${row.querySelector(".pp-explorable-cmdtext")?.textContent}:${badge(row)}`,
  )

/** The same for the line of what reaches the engine. */
const sent = (container: HTMLElement) =>
  container.querySelector(
    '.pp-explorable-pane[data-active="true"] .pp-explorable-outcome',
  )?.textContent

const toggle = (container: HTMLElement, pattern: string) => {
  const button = [
    ...container.querySelectorAll<HTMLButtonElement>(".pp-explorable-cmd"),
  ].find((b) => b.textContent === pattern)
  if (!button) {
    throw new Error(`no toggle for ${pattern}`)
  }
  fireEvent.click(button)
}

describe("BuildContext", () => {
  /** The served state is the repository's ignore file as it stands. */
  test("renders the directory with the ignore file applied", () => {
    const { container, getByText } = renderFigure()

    expect(rows(container)).toEqual([
      "ran:Dockerfile:送られる",
      "ran:index.html:送られる",
      "skipped:node_modules:node_modules で除外",
      "skipped:packages/core/node_modules:**/node_modules で除外",
      "skipped:.git:.git で除外",
    ])
    expect(sent(container)).toBe("Dockerfile  index.html")
    expect(getByText("5 件のうち 2 件が送られる")).toBeDefined()
  })

  /**
   * The globstar line covers the bare one, so switching that off leaves the
   * entry out — and the badge names the line that did it.
   */
  test("a line another line covers keeps its entry out anyway", () => {
    const { container, getByText } = renderFigure()

    toggle(container, "node_modules")

    expect(rows(container)[2]).toBe(
      "skipped:node_modules:**/node_modules で除外",
    )
    expect(getByText("5 件のうち 2 件が送られる")).toBeDefined()
  })

  test("switching both lines off puts the dependencies on the wire", () => {
    const { container, getByText } = renderFigure()

    toggle(container, "node_modules")
    toggle(container, "**/node_modules")

    expect(rows(container)[2]).toBe("ran:node_modules:送られる")
    expect(rows(container)[3]).toBe("ran:packages/core/node_modules:送られる")
    expect(getByText("5 件のうち 4 件が送られる")).toBeDefined()
  })

  test("a toggle says whether its line is on", () => {
    const { container, getByRole } = renderFigure()
    const button = getByRole("button", { name: ".git" })

    expect(button.getAttribute("aria-pressed")).toBe("true")
    toggle(container, ".git")
    expect(button.getAttribute("aria-pressed")).toBe("false")
    expect(rows(container)[4]).toBe("ran:.git:送られる")
  })

  test("reset returns to the ignore file as written", () => {
    const { container, getByRole } = renderFigure()
    const reset = getByRole("button", { name: "Reset" }) as HTMLButtonElement
    expect(reset.disabled).toBe(true)

    toggle(container, ".git")
    expect(reset.disabled).toBe(false)

    fireEvent.click(reset)
    expect(sent(container)).toBe("Dockerfile  index.html")
    expect(reset.disabled).toBe(true)
  })

  test("throws on a directory with nothing in it", () => {
    expect(() =>
      render(
        <BuildContext
          entries={[]}
          ignore={["x"]}
          labels={{
            directory: "d",
            excludedState: "{pattern}",
            ignore: "i",
            sent: "s",
            sentState: "s",
          }}
          status="{sent}"
          title="t"
        />,
      ),
    ).toThrow("no entries")
  })
})
