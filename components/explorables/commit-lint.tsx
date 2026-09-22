"use client"

import { useId, useState } from "react"
import { lint, parseHeader } from "@/lib/explorables/commitlint"
import { fill } from "@/lib/explorables/format"
import { Explorable } from "./explorable"

type Props = Readonly<{
  title: string
  hint?: string
  caption?: string
  /** Accessible label of the text field, in the article's language. */
  label: string
  /** Messages the reader can load with one press; the transcripts' inputs. */
  presets: readonly string[]
  /** Index into `presets` of the message the figure is served with. */
  initial: number
  /** Names for the four parts of the header, shown in the breakdown. */
  parts: Readonly<{
    type: string
    scope: string
    breaking: string
    subject: string
  }>
  status: Readonly<{
    /** Spoken when the message passes. */
    ok: string
    /** Spoken when it does not; may use `{n}`. */
    problems: string
  }>
}>

/**
 * A commit message checked as the reader types it.
 *
 * The field holds one line, the header. Under it, the header is taken apart
 * into type, scope, `!` and subject the way commitlint's parser does, and
 * below that is what `commitlint --verbose` would print for it: the input
 * echoed, one line per broken rule with the rule's name in brackets, and the
 * count. The rules are the header rules of `@commitlint/config-conventional`,
 * ported in `lib/explorables/commitlint.ts`, and the messages are
 * commitlint's own — that output is what the reader will meet in their
 * terminal, so it is not translated.
 *
 * Authored in MDX with every other word in the article's language:
 *
 *     <CommitLint
 *       title="commitlint"
 *       hint="Edit the message; it is checked as you type"
 *       label="First line of the commit message"
 *       presets={["update stuff", "Fix: Login Button.", "fix(auth): keep the session alive"]}
 *       initial={1}
 *       parts={{ type: "type", scope: "scope", breaking: "!", subject: "subject" }}
 *       status={{ ok: "No problems", problems: "{n} problems; the name in brackets is the rule" }}
 *     />
 *
 * Presets are buttons that load the field, pressed while the field still
 * holds them. Reset returns to the preset the figure was served with.
 */
export function CommitLint({
  title,
  hint,
  caption,
  label,
  presets,
  initial,
  parts,
  status,
}: Props) {
  if (presets.length === 0) {
    throw new Error("CommitLint: no presets")
  }
  // A preset is a button keyed and pressed by its text, so two alike would
  // be two buttons pressed at once.
  const duplicate = presets.find((preset, i) => presets.indexOf(preset) !== i)
  if (duplicate !== undefined) {
    throw new Error(`CommitLint: preset "${duplicate}" appears twice`)
  }
  if (!Number.isInteger(initial) || initial < 0 || initial >= presets.length) {
    throw new Error(
      `CommitLint: initial=${initial} but ${presets.length} presets`,
    )
  }
  const [input, setInput] = useState(presets[initial])
  const id = useId()
  const parsed = parseHeader(input)
  const findings = lint(input)
  const count = findings.length

  const breakdown = [
    { name: parts.type, value: parsed.type },
    { name: parts.scope, value: parsed.scope },
    { name: parts.breaking, value: parsed.breaking ? "!" : null },
    { name: parts.subject, value: parsed.subject },
  ]

  return (
    <Explorable
      caption={caption}
      hint={hint}
      onReset={() => setInput(presets[initial])}
      pristine={input === presets[initial]}
      status={count === 0 ? status.ok : fill(status.problems, { n: count })}
      title={title}
    >
      <div className="grid gap-1">
        <label className="pp-explorable-note" htmlFor={id}>
          {label}
        </label>
        <input
          autoComplete="off"
          className="pp-explorable-input"
          id={id}
          onChange={(event) => setInput(event.target.value)}
          spellCheck={false}
          type="text"
          value={input}
        />
      </div>
      <div className="pp-explorable-controls">
        {presets.map((preset) => (
          <button
            aria-pressed={preset === input}
            className="pp-explorable-cmd"
            key={preset}
            onClick={() => setInput(preset)}
            type="button"
          >
            {preset}
          </button>
        ))}
      </div>
      <div className="pp-explorable-parts">
        {breakdown.map((part) => (
          <span
            className="pp-explorable-part"
            data-on={part.value !== null}
            key={part.name}
          >
            <span className="pp-explorable-part-name">{part.name}</span>
            <span>{part.value ?? "—"}</span>
          </span>
        ))}
      </div>
      <div className="pp-explorable-term">
        <div className="pp-explorable-line" data-level="input">
          --- input ---
        </div>
        <div className="pp-explorable-line" data-level="echo">
          {input}
        </div>
        {findings.map((finding) => (
          <div
            className="pp-explorable-line"
            data-level="error"
            key={finding.rule}
          >
            {finding.message}{" "}
            <span className="pp-explorable-rule">[{finding.rule}]</span>
          </div>
        ))}
        <div
          className="pp-explorable-line"
          data-level={count === 0 ? "ok" : "error"}
        >
          found {count} problems, 0 warnings
        </div>
      </div>
    </Explorable>
  )
}
