import { afterEach, describe, expect, test } from "bun:test"
import { cleanup, fireEvent, render } from "@testing-library/react"
import { CommitLint } from "@/components/explorables/commit-lint"

afterEach(cleanup)

const presets = [
  "update stuff",
  "Fix: Login Button.",
  "fix(auth): keep the session alive across a token refresh",
]

function renderFigure(initial = 1) {
  return render(
    <CommitLint
      hint="Edit the message"
      initial={initial}
      label="First line of the commit message"
      parts={{
        breaking: "!",
        scope: "scope",
        subject: "subject",
        type: "type",
      }}
      presets={presets}
      status={{ ok: "No problems", problems: "{n} problems" }}
      title="commitlint"
    />,
  )
}

const lines = (container: HTMLElement) =>
  [...container.querySelectorAll(".pp-explorable-line")].map(
    (line) => `${line.getAttribute("data-level")}:${line.textContent}`,
  )

const parts = (container: HTMLElement) =>
  [...container.querySelectorAll(".pp-explorable-part")].map(
    (part) => `${part.getAttribute("data-on")}:${part.textContent}`,
  )

describe("CommitLint", () => {
  /**
   * The served markup is the second transcript of the article: the field
   * holds "Fix: Login Button." and the four findings are printed under it,
   * so the figure reads the same before hydration as after.
   */
  test("renders the served preset and its findings", () => {
    const { container, getByLabelText, getByText } = renderFigure()

    const field = getByLabelText(
      "First line of the commit message",
    ) as HTMLInputElement
    expect(field.value).toBe("Fix: Login Button.")
    expect(lines(container)).toEqual([
      "input:--- input ---",
      "echo:Fix: Login Button.",
      "error:subject must not be sentence-case, start-case, pascal-case, upper-case [subject-case]",
      "error:subject may not end with full stop [subject-full-stop]",
      "error:type must be lower-case [type-case]",
      "error:type must be one of [build, chore, ci, docs, feat, fix, perf, refactor, revert, style, test] [type-enum]",
      "error:found 4 problems, 0 warnings",
    ])
    expect(parts(container)).toEqual([
      "true:typeFix",
      "false:scope—",
      "false:!—",
      "true:subjectLogin Button.",
    ])
    expect(getByText("4 problems")).toBeDefined()
  })

  test("checks the field as it is typed", () => {
    const { container, getByLabelText, getByText } = renderFigure()
    const field = getByLabelText("First line of the commit message")

    fireEvent.change(field, {
      target: { value: "feat(api)!: drop the v1 endpoints" },
    })

    expect(lines(container).at(-1)).toBe("ok:found 0 problems, 0 warnings")
    expect(parts(container)).toEqual([
      "true:typefeat",
      "true:scopeapi",
      "true:!!",
      "true:subjectdrop the v1 endpoints",
    ])
    expect(getByText("No problems")).toBeDefined()
  })

  test("a preset button loads the field and shows as pressed", () => {
    const { container, getByLabelText, getByRole } = renderFigure()

    fireEvent.click(getByRole("button", { name: "update stuff" }))

    expect(
      (getByLabelText("First line of the commit message") as HTMLInputElement)
        .value,
    ).toBe("update stuff")
    expect(
      getByRole("button", { name: "update stuff" }).getAttribute(
        "aria-pressed",
      ),
    ).toBe("true")
    expect(
      getByRole("button", { name: "Fix: Login Button." }).getAttribute(
        "aria-pressed",
      ),
    ).toBe("false")
    expect(lines(container).slice(2)).toEqual([
      "error:subject may not be empty [subject-empty]",
      "error:type may not be empty [type-empty]",
      "error:found 2 problems, 0 warnings",
    ])
  })

  test("reset returns to the served preset", () => {
    const { getByLabelText, getByRole } = renderFigure()
    const reset = getByRole("button", { name: "Reset" }) as HTMLButtonElement
    const field = getByLabelText(
      "First line of the commit message",
    ) as HTMLInputElement
    expect(reset.disabled).toBe(true)

    fireEvent.change(field, { target: { value: "fix: x" } })
    expect(reset.disabled).toBe(false)

    fireEvent.click(reset)
    expect(field.value).toBe("Fix: Login Button.")
    expect(reset.disabled).toBe(true)
  })

  test("throws on a preset that appears twice", () => {
    expect(() =>
      render(
        <CommitLint
          initial={0}
          label="l"
          parts={{
            breaking: "!",
            scope: "scope",
            subject: "subject",
            type: "type",
          }}
          presets={["fix: a", "fix: a"]}
          status={{ ok: "ok", problems: "{n}" }}
          title="t"
        />,
      ),
    ).toThrow('preset "fix: a" appears twice')
  })

  test("throws on an initial index outside the presets", () => {
    expect(() => renderFigure(3)).toThrow("initial=3 but 3 presets")
  })
})
