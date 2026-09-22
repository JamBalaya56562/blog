import { afterEach, describe, expect, test } from "bun:test"
import { cleanup, fireEvent, render } from "@testing-library/react"
import { BookmarkGraph } from "@/components/explorables/bookmark-graph"

afterEach(cleanup)

function renderFigure() {
  return render(
    <BookmarkGraph
      caption="A bookmark stays where you put it"
      commands={{
        bookmark: { git: "—", jj: "jj bookmark set main -r @-" },
        commit: { git: "git commit", jj: "jj describe + jj new" },
        push: { git: "git push", jj: "jj git push --bookmark main" },
      }}
      descs={["Add README", "Greet the world", "Add a licence note"]}
      empty="(empty)"
      hint="Press a command"
      labels={{
        at: "@",
        git: "Git",
        head: "HEAD",
        jj: "jj",
        main: "main",
        remote: "origin/main",
      }}
      status={{
        bookmark: "main now names the last commit",
        commit: "committed {desc}",
        initial: "one commit on each side",
        push: "pushed",
      }}
      title="git / jj"
    />,
  )
}

/** Each column's rows as "glyph kind | description | names". */
function column(container: HTMLElement, label: string) {
  const list = container.querySelector(`ol[aria-label="${label}"]`)
  return [...(list?.querySelectorAll(".pp-explorable-graph-row") ?? [])].map(
    (row) =>
      [
        row.querySelector(".pp-explorable-glyph")?.getAttribute("data-kind"),
        row.querySelector(".pp-explorable-graph-desc")?.textContent,
        [...row.querySelectorAll(".pp-explorable-ref")]
          .map((ref) => ref.textContent)
          .join(" "),
      ].join(" | "),
  )
}

const press = (container: HTMLElement, text: string) => {
  const button = [
    ...container.querySelectorAll<HTMLButtonElement>(".pp-explorable-cmd"),
  ].find((b) => b.textContent?.includes(text))
  if (!button) {
    throw new Error(`no button for ${text}`)
  }
  fireEvent.click(button)
  return button
}

describe("BookmarkGraph", () => {
  /**
   * The served markup is a fresh clone: one commit on the Git side, and on
   * the jj side the same commit with an empty working copy above it, which
   * is what `jj log` shows before anything is done.
   */
  test("renders both histories as served", () => {
    const { container, getByText } = renderFigure()

    expect(column(container, "Git")).toEqual([
      "commit | Add README | HEAD main",
    ])
    expect(column(container, "jj")).toEqual([
      "at | (empty) | @",
      "commit | Add README | main",
    ])
    expect(getByText("one commit on each side")).toBeDefined()
  })

  /**
   * The article's sentence, on screen: "Git では main にいる状態でコミット
   * すれば main が進みますが、jj の bookmark は、置いたコミットにそのまま
   * 留まります".
   */
  test("a commit carries Git's branch and leaves jj's bookmark behind", () => {
    const { container, getByText } = renderFigure()

    press(container, "git commit")

    expect(column(container, "Git")).toEqual([
      "commit | Greet the world | HEAD main",
      "commit | Add README | ",
    ])
    expect(column(container, "jj")).toEqual([
      "at | (empty) | @",
      "commit | Greet the world | ",
      "commit | Add README | main",
    ])
    expect(getByText("committed Greet the world")).toBeDefined()
  })

  test("moving the bookmark brings it up to the last commit", () => {
    const { container, getByText } = renderFigure()

    press(container, "git commit")
    press(container, "jj bookmark set")

    expect(column(container, "jj")).toEqual([
      "at | (empty) | @",
      "commit | Greet the world | main",
      "commit | Add README | ",
    ])
    expect(getByText("main now names the last commit")).toBeDefined()
  })

  /** "push した瞬間に、今いた変更が immutable（◆）になり". */
  test("pushing marks what the remote holds as immutable", () => {
    const { container } = renderFigure()

    press(container, "git commit")
    press(container, "jj bookmark set")
    press(container, "jj git push")

    expect(column(container, "jj")).toEqual([
      "at | (empty) | @",
      "immutable | Greet the world | main origin/main",
      "immutable | Add README | ",
    ])
    expect(column(container, "Git")).toEqual([
      "immutable | Greet the world | HEAD main origin/main",
      "immutable | Add README | ",
    ])
  })

  /**
   * A button that quietly does nothing would teach the wrong lesson: with
   * the bookmark already on the last commit there is nothing to move.
   */
  test("a command with nothing left to do is disabled", () => {
    const { container } = renderFigure()

    const bookmark = press(container, "jj bookmark set")
    expect(bookmark.disabled).toBe(true)

    press(container, "git commit")
    expect(bookmark.disabled).toBe(false)
    press(container, "jj bookmark set")
    expect(bookmark.disabled).toBe(true)
  })

  test("reset returns both histories to the served state", () => {
    const { container, getByRole } = renderFigure()
    const reset = getByRole("button", { name: "Reset" }) as HTMLButtonElement
    expect(reset.disabled).toBe(true)

    press(container, "git commit")
    expect(reset.disabled).toBe(false)

    fireEvent.click(reset)
    expect(column(container, "Git")).toEqual([
      "commit | Add README | HEAD main",
    ])
    expect(reset.disabled).toBe(true)
  })

  test("throws when there is nothing to commit", () => {
    expect(() =>
      render(
        <BookmarkGraph
          commands={{
            bookmark: { git: "—", jj: "b" },
            commit: { git: "c", jj: "c" },
            push: { git: "p", jj: "p" },
          }}
          descs={[]}
          empty="(empty)"
          labels={{
            at: "@",
            git: "Git",
            head: "HEAD",
            jj: "jj",
            main: "main",
            remote: "origin/main",
          }}
          status={{
            bookmark: "b",
            commit: "c",
            initial: "i",
            push: "p",
          }}
          title="t"
        />,
      ),
    ).toThrow("no descs")
  })
})
