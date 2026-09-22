import { describe, expect, test } from "bun:test"
import fc from "fast-check"
import {
  type Bump,
  bumpOf,
  changelogOf,
  derive,
  initialState,
  isInitial,
  nextVersion,
  reduce,
  type SemverBumpAction,
  type SemverBumpContent,
} from "@/lib/explorables/semver-bump"

/** The article's own release: a feature, a fix and a build commit. */
const content: SemverBumpContent = {
  commits: [
    "feat(api)!: drop the v1 endpoints",
    "fix(api): return 404 for an unknown id",
    "feat(api): add a search endpoint",
    "build(git): check commit messages with commitlint through lefthook",
  ],
  current: "1.2.3",
  groups: [
    { label: "🚀 Features", types: ["feat"] },
    { label: "🐛 Bug Fixes", types: ["fix"] },
  ],
  initial: [1, 2, 3],
  labels: {
    changelog: "CHANGELOG",
    commits: "commits",
    none: "—",
    reason: {
      major: "a breaking change",
      minor: "a feature",
      none: "nothing to release",
      patch: "a fix",
    },
    version: "version",
  },
  otherLabel: "💼 Other",
  status: "{version} — {reason}",
}

const action = fc.oneof(
  fc.record({
    index: fc.integer({ max: 5, min: -1 }),
    type: fc.constant("toggle" as const),
  }),
  fc.constant<SemverBumpAction>({ type: "reset" }),
)
const actions = fc.array(action, { maxLength: 12 })
const run = (list: readonly SemverBumpAction[]) =>
  list.reduce((s, a) => reduce(s, a, content), initialState(content))

const headers = fc.array(
  fc.constantFrom(
    "feat(api)!: drop the v1 endpoints",
    "fix(api): return 404 for an unknown id",
    "feat(api): add a search endpoint",
    "build(git): check commit messages",
    "chore: tidy up",
  ),
  { maxLength: 6 },
)

describe("semver bump", () => {
  /**
   * The article's table, as a rule: `!` outranks `feat`, which outranks
   * `fix`. A release is decided by its boldest commit, not by how many
   * there are.
   */
  test("Property 1: the boldest commit decides the bump", () => {
    fc.assert(
      fc.property(headers, (list) => {
        const bump = bumpOf(list)
        const has = (needle: string) => list.some((h) => h.startsWith(needle))
        const expected: Bump = has("feat(api)!")
          ? "major"
          : has("feat")
            ? "minor"
            : has("fix")
              ? "patch"
              : "none"
        expect(bump).toBe(expected)
      }),
      { numRuns: 300 },
    )
  })

  test("Property 2: order does not change the bump", () => {
    fc.assert(
      fc.property(headers, (list) => {
        expect(bumpOf([...list].reverse())).toBe(bumpOf(list))
      }),
      { numRuns: 300 },
    )
  })

  /** Only the part the bump names moves; everything smaller goes to zero. */
  test("Property 3: a bump moves one part and zeroes the rest", () => {
    fc.assert(
      fc.property(
        fc.tuple(
          fc.integer({ max: 20, min: 0 }),
          fc.integer({ max: 20, min: 0 }),
          fc.integer({ max: 20, min: 0 }),
        ),
        fc.constantFrom<Bump>("major", "minor", "patch", "none"),
        ([major, minor, patch], bump) => {
          const current = `${major}.${minor}.${patch}`
          const next = nextVersion(current, bump)
          if (bump === "none") {
            expect(next).toBe(null)
            return
          }
          expect(next).toBe(
            bump === "major"
              ? `${major + 1}.0.0`
              : bump === "minor"
                ? `${major}.${minor + 1}.0`
                : `${major}.${minor}.${patch + 1}`,
          )
        },
      ),
      { numRuns: 300 },
    )
  })

  test("Property 4: every included commit lands in exactly one group", () => {
    fc.assert(
      fc.property(actions, (list) => {
        const state = run(list)
        const included = content.commits.filter((_, i) => state.included[i])
        const entries = derive(state, content).changelog.flatMap(
          (group) => group.entries,
        )
        expect(entries).toHaveLength(included.length)
      }),
      { numRuns: 300 },
    )
  })

  test("Property 5: reset returns to the served release", () => {
    fc.assert(
      fc.property(actions, (list) => {
        const back = reduce(run(list), { type: "reset" }, content)
        expect(back).toEqual(initialState(content))
        expect(isInitial(back, content)).toBe(true)
      }),
      { numRuns: 300 },
    )
  })

  /** The two numbers the article prints from this very history. */
  test("matches the article's transcripts", () => {
    const served = derive(initialState(content), content)
    expect(served.bump).toBe("minor")
    expect(served.version).toBe("1.3.0")

    const withBreaking = derive(
      reduce(initialState(content), { index: 0, type: "toggle" }, content),
      content,
    )
    expect(withBreaking.bump).toBe("major")
    expect(withBreaking.version).toBe("2.0.0")
  })

  test("groups the changelog the way the article's output does", () => {
    const all = changelogOf(content.commits, content)
    expect(all).toEqual([
      {
        entries: [
          {
            breaking: true,
            text: "*(api)* [**breaking**] Drop the v1 endpoints",
          },
          { breaking: false, text: "*(api)* Add a search endpoint" },
        ],
        label: "🚀 Features",
      },
      {
        entries: [
          { breaking: false, text: "*(api)* Return 404 for an unknown id" },
        ],
        label: "🐛 Bug Fixes",
      },
      {
        entries: [
          {
            breaking: false,
            text: "*(git)* Check commit messages with commitlint through lefthook",
          },
        ],
        label: "💼 Other",
      },
    ])
  })

  test("leaves out a group nothing landed in", () => {
    expect(
      changelogOf(["fix(api): return 404 for an unknown id"], content).map(
        (group) => group.label,
      ),
    ).toEqual(["🐛 Bug Fixes"])
  })

  test("a line that is not a conventional header is left out", () => {
    expect(changelogOf(["update stuff"], content)).toEqual([])
    expect(bumpOf(["update stuff"])).toBe("none")
  })

  test("with nothing released there is no version", () => {
    // Toggling every index would switch the breaking commit *on*, since it
    // starts out of the release; only the included ones are turned off.
    const empty = content.initial.reduce(
      (state, index) => reduce(state, { index, type: "toggle" }, content),
      initialState(content),
    )
    expect(empty.included).toEqual([false, false, false, false])
    const view = derive(empty, content)
    expect(view.bump).toBe("none")
    expect(view.version).toBe(null)
    expect(view.changelog).toEqual([])
  })

  test("rejects content it cannot compute", () => {
    expect(() => initialState({ ...content, commits: [] })).toThrow(
      "no commits",
    )
    expect(() => initialState({ ...content, current: "v1.2.3" })).toThrow(
      '"v1.2.3" is not a version',
    )
    expect(() => initialState({ ...content, initial: [9] })).toThrow(
      "initial 9 but 4 commits",
    )
  })
})
