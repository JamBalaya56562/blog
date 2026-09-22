import { afterEach, describe, expect, test } from "bun:test"
import { cleanup, fireEvent, render } from "@testing-library/react"
import { SemverBump } from "@/components/explorables/semver-bump"

afterEach(cleanup)

const commits = [
  "feat(api)!: drop the v1 endpoints",
  "fix(api): return 404 for an unknown id",
  "feat(api): add a search endpoint",
  "build(git): check commit messages with commitlint through lefthook",
]

function renderFigure(initial: readonly number[] = [1, 2, 3]) {
  return render(
    <SemverBump
      caption="The version comes out of the messages"
      commits={commits}
      current="1.2.3"
      groups={[
        { label: "🚀 Features", types: ["feat"] },
        { label: "🐛 Bug Fixes", types: ["fix"] },
      ]}
      hint="Take a commit out of the release"
      initial={initial}
      labels={{
        changelog: "CHANGELOG",
        commits: "Commits since the tag",
        none: "no release",
        reason: {
          major: "a breaking change",
          minor: "a feature",
          none: "nothing to release",
          patch: "a fix",
        },
        version: "Next version",
      }}
      otherLabel="💼 Other"
      status="{version} — {reason}"
      title="git cliff"
    />,
  )
}

const rows = (container: HTMLElement) =>
  [...container.querySelectorAll<HTMLButtonElement>(".pp-explorable-row")].map(
    (row) => `${row.dataset.state}:${row.textContent}`,
  )

const version = (container: HTMLElement) =>
  container.querySelector(".pp-explorable-version")?.textContent

const changelog = (container: HTMLElement) =>
  [
    ...container.querySelectorAll(
      ".pp-explorable-changelog-head, .pp-explorable-changelog-entry",
    ),
  ].map((node) => node.textContent)

const press = (container: HTMLElement, text: string) => {
  const row = [
    ...container.querySelectorAll<HTMLButtonElement>(".pp-explorable-row"),
  ].find((r) => r.textContent === text)
  if (!row) {
    throw new Error(`no row for ${text}`)
  }
  fireEvent.click(row)
}

describe("SemverBump", () => {
  /**
   * The served state is the article's first transcript: a feature and a fix
   * since the tag, and `git cliff --bumped-version` printing v1.3.0.
   */
  test("renders the release as served", () => {
    const { container, getByText } = renderFigure()

    expect(rows(container)[0]).toBe(`off:${commits[0]}`)
    expect(rows(container)[1]).toBe(`changed:${commits[1]}`)
    expect(version(container)).toBe("1.2.3 → 1.3.0")
    expect(getByText("1.3.0 — a feature")).toBeDefined()
  })

  /** The article's second transcript: add the breaking change, get v2.0.0. */
  test("adding the breaking change makes it a major release", () => {
    const { container, getByText } = renderFigure()

    press(container, commits[0])

    expect(version(container)).toBe("1.2.3 → 2.0.0")
    expect(getByText("2.0.0 — a breaking change")).toBeDefined()
    expect(changelog(container)).toContain(
      "*(api)* [**breaking**] Drop the v1 endpoints",
    )
  })

  test("taking the feature out drops it to a patch", () => {
    const { container, getByText } = renderFigure()

    press(container, commits[2])

    expect(version(container)).toBe("1.2.3 → 1.2.4")
    expect(getByText("1.2.4 — a fix")).toBeDefined()
    // The Features heading goes with its last entry.
    expect(changelog(container)).not.toContain("🚀 Features")
  })

  test("the changelog is grouped the way the tool prints it", () => {
    const { container } = renderFigure([0, 1, 2, 3])

    expect(changelog(container)).toEqual([
      "🚀 Features",
      "*(api)* [**breaking**] Drop the v1 endpoints",
      "*(api)* Add a search endpoint",
      "🐛 Bug Fixes",
      "*(api)* Return 404 for an unknown id",
      "💼 Other",
      "*(git)* Check commit messages with commitlint through lefthook",
    ])
  })

  test("with nothing in the release there is no version to print", () => {
    const { container, getByText } = renderFigure([])

    expect(version(container)).toBe("1.2.3 → no release")
    expect(getByText("no release — nothing to release")).toBeDefined()
    expect(changelog(container)).toEqual([])
  })

  test("a row says whether it is in the release", () => {
    const { container } = renderFigure()
    const row = container.querySelector<HTMLButtonElement>(
      ".pp-explorable-row",
    ) as HTMLButtonElement

    expect(row.getAttribute("aria-pressed")).toBe("false")
    fireEvent.click(row)
    expect(row.getAttribute("aria-pressed")).toBe("true")
  })

  test("reset returns to the served release", () => {
    const { container, getByRole } = renderFigure()
    const reset = getByRole("button", { name: "Reset" }) as HTMLButtonElement
    expect(reset.disabled).toBe(true)

    press(container, commits[0])
    expect(reset.disabled).toBe(false)

    fireEvent.click(reset)
    expect(version(container)).toBe("1.2.3 → 1.3.0")
    expect(reset.disabled).toBe(true)
  })

  test("throws on a version it cannot bump", () => {
    expect(() =>
      render(
        <SemverBump
          commits={commits}
          current="v1.2.3"
          groups={[]}
          initial={[]}
          labels={{
            changelog: "c",
            commits: "c",
            none: "n",
            reason: { major: "m", minor: "m", none: "n", patch: "p" },
            version: "v",
          }}
          otherLabel="o"
          status="{version}"
          title="t"
        />,
      ),
    ).toThrow('"v1.2.3" is not a version')
  })
})
