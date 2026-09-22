/**
 * The state behind the release figure: a handful of commits the reader can
 * take in and out of a release, and the two things a tool works out from
 * them — the next version number and the grouped CHANGELOG.
 *
 * Both come from the headers alone, which is the article's claim: "書いたの
 * はコミットメッセージだけ". The headers are parsed by the same port the
 * commitlint figure uses, so a message that would not pass there does not
 * quietly count here either.
 */

import { parseHeader } from "./commitlint"

export type Bump = "major" | "minor" | "patch" | "none"

export type SemverBumpContent = Readonly<{
  /** The version the last tag carries, e.g. "1.2.3". */
  current: string
  /** Commit headers, newest first, as `git log --oneline` prints them. */
  commits: readonly string[]
  /** Which commits start out in the release; the rest are unchecked. */
  initial: readonly number[]
  /**
   * The CHANGELOG's headings and the types under each, in the tool's own
   * words. Anything not listed falls into `otherLabel`.
   */
  groups: readonly Readonly<{ label: string; types: readonly string[] }>[]
  otherLabel: string
  labels: Readonly<{
    /** Heading over the commit list. */
    commits: string
    /** Heading over the computed version. */
    version: string
    /** Heading over the CHANGELOG. */
    changelog: string
    /** Shown in place of a version when nothing asks for one. */
    none: string
    /** The reason each bump happened, keyed by the bump. */
    reason: Readonly<Record<Bump, string>>
  }>
  /** Spoken on each change; may use `{version}` and `{reason}`. */
  status: string
}>

export type SemverBumpState = Readonly<{ included: readonly boolean[] }>

export type SemverBumpAction =
  | { type: "toggle"; index: number }
  | { type: "reset" }

export function initialState(content: SemverBumpContent): SemverBumpState {
  if (content.commits.length === 0) {
    throw new Error("SemverBump: no commits")
  }
  if (!/^\d+\.\d+\.\d+$/.test(content.current)) {
    throw new Error(`SemverBump: "${content.current}" is not a version`)
  }
  for (const index of content.initial) {
    if (
      !Number.isInteger(index) ||
      index < 0 ||
      index >= content.commits.length
    ) {
      throw new Error(
        `SemverBump: initial ${index} but ${content.commits.length} commits`,
      )
    }
  }
  return {
    included: content.commits.map((_, i) => content.initial.includes(i)),
  }
}

export function reduce(
  state: SemverBumpState,
  action: SemverBumpAction,
  content: SemverBumpContent,
): SemverBumpState {
  switch (action.type) {
    case "toggle": {
      if (action.index < 0 || action.index >= state.included.length) {
        return state
      }
      return {
        included: state.included.map((on, i) =>
          i === action.index ? !on : on,
        ),
      }
    }
    case "reset":
      return initialState(content)
  }
}

export function isInitial(
  state: SemverBumpState,
  content: SemverBumpContent,
): boolean {
  return state.included.join() === initialState(content).included.join()
}

/**
 * The largest bump the commits ask for. One breaking change outranks every
 * feature, and one feature outranks every fix — which is why a release is
 * decided by its boldest commit rather than by how many there are.
 */
export function bumpOf(headers: readonly string[]): Bump {
  let bump: Bump = "none"
  for (const header of headers) {
    const { type, breaking } = parseHeader(header)
    if (breaking) {
      return "major"
    }
    if (type === "feat") {
      bump = "minor"
    } else if (type === "fix" && bump !== "minor") {
      bump = "patch"
    }
  }
  return bump
}

/** `1.2.3` after the bump, or nothing when there is no reason to bump. */
export function nextVersion(current: string, bump: Bump): string | null {
  const [major, minor, patch] = current.split(".").map(Number)
  switch (bump) {
    case "major":
      return `${major + 1}.0.0`
    case "minor":
      return `${major}.${minor + 1}.0`
    case "patch":
      return `${major}.${minor}.${patch + 1}`
    case "none":
      return null
  }
}

export type ChangelogEntry = Readonly<{ text: string; breaking: boolean }>
export type ChangelogGroup = Readonly<{
  label: string
  entries: readonly ChangelogEntry[]
}>

/** A subject the way a changelog prints it: first letter up. */
function titled(subject: string): string {
  return subject.charAt(0).toUpperCase() + subject.slice(1)
}

/**
 * The CHANGELOG the headers make, in the groups the content names and in
 * that order. A group nothing landed in is left out, as the tool leaves it
 * out.
 */
export function changelogOf(
  headers: readonly string[],
  content: SemverBumpContent,
): readonly ChangelogGroup[] {
  const groups = new Map<string, ChangelogEntry[]>()

  for (const header of headers) {
    const { type, scope, subject, breaking } = parseHeader(header)
    if (subject === null) {
      continue
    }
    const label =
      content.groups.find(
        (group) => type !== null && group.types.includes(type),
      )?.label ?? content.otherLabel
    const entry: ChangelogEntry = {
      breaking,
      text: `${scope === null ? "" : `*(${scope})* `}${breaking ? "[**breaking**] " : ""}${titled(subject)}`,
    }
    groups.set(label, [...(groups.get(label) ?? []), entry])
  }

  return [...content.groups.map((group) => group.label), content.otherLabel]
    .filter((label, index, all) => all.indexOf(label) === index)
    .flatMap((label) => {
      const entries = groups.get(label)
      return entries === undefined ? [] : [{ entries, label }]
    })
}

export type SemverBumpView = Readonly<{
  bump: Bump
  version: string | null
  changelog: readonly ChangelogGroup[]
}>

export function derive(
  state: SemverBumpState,
  content: SemverBumpContent,
): SemverBumpView {
  const headers = content.commits.filter((_, i) => state.included[i])
  const bump = bumpOf(headers)
  return {
    bump,
    changelog: changelogOf(headers, content),
    version: nextVersion(content.current, bump),
  }
}
