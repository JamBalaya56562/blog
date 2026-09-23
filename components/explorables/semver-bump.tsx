"use client"

import { useReducer } from "react"
import { fill } from "@/lib/explorables/format"
import {
  derive,
  initialState,
  isInitial,
  nextVersion,
  reduce,
  type SemverBumpAction,
  type SemverBumpContent,
  type SemverBumpState,
} from "@/lib/explorables/semver-bump"
import { Explorable } from "./explorable"
import { Frame } from "./frame"

type Props = SemverBumpContent &
  Readonly<{
    title: string
    hint?: string
    caption?: string
  }>

/**
 * The commits of a release, and the two things a tool reads out of them.
 *
 * Take a commit out and both the version and the CHANGELOG follow: drop the
 * one breaking change and a major release becomes a minor one, drop the
 * feature too and it becomes a patch. Nothing here is written by hand — the
 * headers are parsed the same way the commitlint figure parses them, which
 * is the article's point: 「書いたのはコミットメッセージだけ」.
 *
 * Authored in MDX, with the tool's own words for its headings:
 *
 *     <SemverBump
 *       title="git cliff"
 *       current="1.2.3"
 *       commits={["feat(api)!: drop the v1 endpoints", "fix(api): return 404 for an unknown id"]}
 *       initial={[0, 1]}
 *       groups={[{ label: "🚀 Features", types: ["feat"] }, { label: "🐛 Bug Fixes", types: ["fix"] }]}
 *       otherLabel="💼 Other"
 *       labels={{ commits: "…", version: "…", changelog: "…", none: "…", reason: { major: "…", … } }}
 *       status="{version} — {reason}"
 *     />
 *
 * Write the commits newest first, as `git log --oneline` prints them.
 */
export function SemverBump({ title, hint, caption, ...content }: Props) {
  const [state, dispatch] = useReducer(
    (current: SemverBumpState, action: SemverBumpAction) =>
      reduce(current, action, content),
    content,
    initialState,
  )
  const view = derive(state, content)
  /**
   * The longest this figure can get: every commit in the release. Both of
   * its panels are given the room for it up front, so taking a commit out
   * and putting it back does not move the article under the figure.
   */
  const whole = derive({ included: content.commits.map(() => true) }, content)
  const bumps = ["major", "minor", "patch", "none"] as const

  /** What the figure says of one kind of release; all four are reserved for. */
  function sentence(bump: (typeof bumps)[number]): string {
    return fill(content.status, {
      reason: content.labels.reason[bump],
      version:
        (bump === view.bump
          ? view.version
          : nextVersion(content.current, bump)) ?? content.labels.none,
    })
  }

  return (
    <Explorable
      caption={caption}
      hint={hint}
      onReset={() => dispatch({ type: "reset" })}
      pristine={isInitial(state, content)}
      status={sentence(view.bump)}
      statuses={bumps.map(sentence)}
      title={title}
    >
      <div className="grid gap-2">
        <p className="pp-explorable-column-head">{content.labels.commits}</p>
        {content.commits.map((header, index) => (
          <button
            aria-pressed={state.included[index]}
            className="pp-explorable-row"
            data-state={state.included[index] ? "changed" : "off"}
            key={header}
            onClick={() => dispatch({ index, type: "toggle" })}
            type="button"
          >
            <span className="pp-explorable-cmdtext">{header}</span>
          </button>
        ))}
      </div>

      {/* One pane per kind of release, so the line that says which one this
          is keeps its height however long that sentence is. */}
      <Frame
        active={bumps.indexOf(view.bump)}
        panes={bumps.map((bump) => (
          <div className="pp-explorable-release" key={bump}>
            <p className="pp-explorable-column-head">
              {content.labels.version}
            </p>
            <p className="pp-explorable-version">
              <span className="pp-explorable-version-from">
                {content.current}
              </span>
              {" → "}
              <span data-bump={bump}>
                {(bump === view.bump ? view.version : null) ??
                  nextVersion(content.current, bump) ??
                  content.labels.none}
              </span>
            </p>
            <p className="pp-explorable-note">{content.labels.reason[bump]}</p>
          </div>
        ))}
      />

      <Frame
        active={0}
        panes={[view.changelog, whole.changelog].map((changelog, index) => (
          <div
            className="pp-explorable-term"
            // The live panel and the whole release, in that order.
            // biome-ignore lint/suspicious/noArrayIndexKey: two fixed panels
            key={index}
          >
            <p className="pp-explorable-column-head">
              {content.labels.changelog}
            </p>
            {changelog.length === 0 ? (
              <p className="pp-explorable-note">—</p>
            ) : (
              changelog.map((group) => (
                <div key={group.label}>
                  <p className="pp-explorable-changelog-head">{group.label}</p>
                  {group.entries.map((entry) => (
                    <p
                      className="pp-explorable-changelog-entry"
                      data-breaking={entry.breaking}
                      key={entry.text}
                    >
                      {entry.text}
                    </p>
                  ))}
                </div>
              ))
            )}
          </div>
        ))}
      />
    </Explorable>
  )
}
