import { describe, expect, test } from "bun:test"
import fc from "fast-check"
import {
  HEADER_MAX_LENGTH,
  lint,
  parseHeader,
  TYPES,
} from "@/lib/explorables/commitlint"

const rules = (header: string) => lint(header).map((f) => f.rule)

const lowerWord = fc.stringMatching(/^[a-z][a-z0-9-]{0,9}$/)
/** A type has to be `\w` only for the parser to see it. */
const typeWord = fc.stringMatching(/^[a-z][a-z0-9]{0,9}$/)
/** A subject that breaks none of the rules: small first letter, no final stop. */
const cleanSubject = fc
  .stringMatching(/^[a-z][a-z0-9 ,'-]{0,40}[a-z0-9]$/)
  .filter((s) => !s.endsWith("."))
const scope = fc.option(lowerWord, { nil: null })
const type = fc.constantFrom(...TYPES)

function header(t: string, s: string | null, bang: boolean, subject: string) {
  return `${t}${s === null ? "" : `(${s})`}${bang ? "!" : ""}: ${subject}`
}

describe("commitlint port", () => {
  /**
   * The three transcripts in the article, pinned: the port has to print what
   * the real tool printed for them, rule for rule and in the same order.
   */
  test("matches the article's transcripts", () => {
    expect(rules("update stuff")).toEqual(["subject-empty", "type-empty"])
    expect(lint("Fix: Login Button.")).toEqual([
      {
        message:
          "subject must not be sentence-case, start-case, pascal-case, upper-case",
        rule: "subject-case",
      },
      {
        message: "subject may not end with full stop",
        rule: "subject-full-stop",
      },
      { message: "type must be lower-case", rule: "type-case" },
      {
        message:
          "type must be one of [build, chore, ci, docs, feat, fix, perf, refactor, revert, style, test]",
        rule: "type-enum",
      },
    ])
    expect(
      lint("fix(auth): keep the session alive across a token refresh"),
    ).toEqual([])
  })

  test("Property 1: a header built to the convention passes", () => {
    fc.assert(
      fc.property(
        type,
        scope,
        fc.boolean(),
        cleanSubject,
        (t, s, bang, subj) => {
          expect(rules(header(t, s, bang, subj))).toEqual([])
        },
      ),
      { numRuns: 200 },
    )
  })

  test("Property 2: the parts come back out of a conventional header", () => {
    fc.assert(
      fc.property(
        type,
        scope,
        fc.boolean(),
        cleanSubject,
        (t, s, bang, subj) => {
          expect(parseHeader(header(t, s, bang, subj))).toEqual({
            breaking: bang,
            scope: s,
            subject: subj,
            type: t,
          })
        },
      ),
      { numRuns: 200 },
    )
  })

  test("Property 3: a capital in the type adds type-case and type-enum", () => {
    fc.assert(
      fc.property(type, scope, cleanSubject, (t, s, subj) => {
        const capitalised = t.charAt(0).toUpperCase() + t.slice(1)
        expect(rules(header(capitalised, s, false, subj))).toEqual([
          "type-case",
          "type-enum",
        ])
      }),
      { numRuns: 100 },
    )
  })

  test("Property 4: a type outside the list adds only type-enum", () => {
    fc.assert(
      fc.property(
        typeWord.filter((w) => !(TYPES as readonly string[]).includes(w)),
        scope,
        cleanSubject,
        (t, s, subj) => {
          expect(rules(header(t, s, false, subj))).toEqual(["type-enum"])
        },
      ),
      { numRuns: 100 },
    )
  })

  test("Property 5: a full stop adds subject-full-stop, a capital adds subject-case", () => {
    fc.assert(
      fc.property(type, scope, cleanSubject, (t, s, subj) => {
        expect(rules(header(t, s, false, `${subj}.`))).toEqual([
          "subject-full-stop",
        ])
        const capitalised = subj.charAt(0).toUpperCase() + subj.slice(1)
        expect(rules(header(t, s, false, capitalised))).toEqual([
          "subject-case",
        ])
      }),
      { numRuns: 100 },
    )
  })

  test("Property 6: a header past the limit adds header-max-length", () => {
    fc.assert(
      fc.property(type, fc.integer({ max: 60, min: 1 }), (t, extra) => {
        const subject = "a".repeat(HEADER_MAX_LENGTH - t.length - 2 + extra)
        const found = lint(header(t, null, false, subject))
        expect(found.map((f) => f.rule)).toEqual(["header-max-length"])
        expect(found[0].message).toBe(
          `header must not be longer than 100 characters, current length is ${HEADER_MAX_LENGTH + extra}`,
        )
      }),
      { numRuns: 60 },
    )
  })

  /**
   * A proper name keeps its capitals: commitlint drops quoted text before it
   * looks at the case, so a subject that opens with a quoted name passes.
   */
  test("ignores quoted text when judging the subject's case", () => {
    expect(rules('docs: "React" is not the subject here')).toEqual([])
    expect(rules("docs: React is the subject here")).toEqual(["subject-case"])
  })

  test("a subject that starts with a digit is left alone", () => {
    expect(rules("fix: 2 bugs in the parser")).toEqual([])
  })

  test("a capital in the scope adds scope-case", () => {
    expect(rules("fix(Auth): keep the session")).toEqual(["scope-case"])
    expect(rules("fix(auth/Token): keep the session")).toEqual(["scope-case"])
  })

  test("whitespace around the header adds header-trim", () => {
    expect(lint(" fix: keep the session")[0]).toEqual({
      message: "header must not start with whitespace",
      rule: "header-trim",
    })
    expect(lint("fix: keep the session ")[0]).toEqual({
      message: "header must not end with whitespace",
      rule: "header-trim",
    })
    expect(lint(" fix: keep the session ")[0]).toEqual({
      message: "header must not be surrounded by whitespace",
      rule: "header-trim",
    })
  })

  test("an empty line is an empty type and an empty subject", () => {
    expect(rules("")).toEqual(["subject-empty", "type-empty"])
  })
})
