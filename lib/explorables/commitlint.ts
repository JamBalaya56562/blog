/**
 * The header rules of `@commitlint/config-conventional`, small enough to run
 * in the reader's browser while they type.
 *
 * This is a port, not the real thing: only the rules that look at the first
 * line, with the parser pattern, the case checks and the messages copied from
 * commitlint so the output matches what the article's transcripts show. The
 * body and footer rules are left out — the figure takes one line.
 *
 * Pure functions, no React. `lint` is what the figure calls; the rest is
 * exported for the tests and for the figure's breakdown of the header.
 */

/** The types `config-conventional` accepts, in the order commitlint prints. */
export const TYPES = [
  "build",
  "chore",
  "ci",
  "docs",
  "feat",
  "fix",
  "perf",
  "refactor",
  "revert",
  "style",
  "test",
] as const

export const HEADER_MAX_LENGTH = 100

export type Parsed = Readonly<{
  type: string | null
  scope: string | null
  breaking: boolean
  subject: string | null
}>

/**
 * The header pattern of the `conventional-changelog-conventionalcommits`
 * preset, which is what commitlint parses with: a word, an optional scope in
 * parentheses, an optional `!`, then a colon and a space. Anything else is no
 * header at all, and every part comes back `null` — which is why a plain
 * sentence trips both `type-empty` and `subject-empty`.
 */
const HEADER = /^(\w*)(?:\((.*)\))?(!)?: (.*)$/

export function parseHeader(header: string): Parsed {
  const match = HEADER.exec(header)
  if (!match) {
    return { breaking: false, scope: null, subject: null, type: null }
  }
  const [, type, scope, bang, subject] = match
  return {
    breaking: bang === "!",
    scope: scope ?? null,
    subject: subject ?? null,
    type: type ?? null,
  }
}

export type RuleId =
  | "header-max-length"
  | "header-trim"
  | "scope-case"
  | "subject-case"
  | "subject-empty"
  | "subject-full-stop"
  | "type-case"
  | "type-empty"
  | "type-enum"

export type Finding = Readonly<{ rule: RuleId; message: string }>

/**
 * commitlint's case check, reduced to the cases the conventional config
 * forbids for a subject. It first drops anything in quotes, since a proper
 * name in the subject is allowed its capitals, and trims. What remains
 * counts as sentence-, start-, pascal- or upper-case when it starts with a
 * capital letter: every one of those four begins that way, and a string that
 * begins with a small letter is none of them. An empty remainder, or one that
 * starts with a digit, counts as a match too, as it does upstream.
 */
function startsCapitalised(value: string): boolean {
  const cleaned = value.replace(/`.*?`|".*?"|'.*?'/g, "").trim()
  if (cleaned === "" || /^\d/.test(cleaned)) {
    return true
  }
  const first = cleaned.charAt(0)
  return first !== first.toLowerCase()
}

/**
 * The subject-case rule only looks at a subject that starts with a cased
 * letter, in any script: commitlint's own guard, with the same Unicode
 * classes. A subject that opens with a digit or a quote is left alone.
 */
const STARTS_WITH_LETTER = /^[\p{Ll}\p{Lu}\p{Lt}]/u

/** A scope may name several parts, split on `/`, `\` or `,` as upstream does. */
const SCOPE_DELIMITER = /[/\\,]/

function isLowerCase(value: string): boolean {
  const cleaned = value.replace(/`.*?`|".*?"|'.*?'/g, "").trim()
  return cleaned === "" || cleaned === cleaned.toLowerCase()
}
type Rule = Readonly<{
  id: RuleId
  /** The message when the rule is broken, or nothing when it holds. */
  check: (header: string, parsed: Parsed) => string | null
}>

/**
 * One entry per rule, in rule-id order — which is the order commitlint
 * prints them, and the order the article's transcripts show, so `lint`
 * needs no sort.
 */
const RULES: readonly Rule[] = [
  {
    check: (header) =>
      header.length > HEADER_MAX_LENGTH
        ? `header must not be longer than ${HEADER_MAX_LENGTH} characters, current length is ${header.length}`
        : null,
    id: "header-max-length",
  },
  {
    check: (header) => {
      const start = header !== header.trimStart()
      const end = header !== header.trimEnd()
      if (start && end) {
        return "header must not be surrounded by whitespace"
      }
      if (start) {
        return "header must not start with whitespace"
      }
      return end ? "header must not end with whitespace" : null
    },
    id: "header-trim",
  },
  {
    check: (_, { scope }) =>
      scope && !scope.split(SCOPE_DELIMITER).every(isLowerCase)
        ? "scope must be lower-case"
        : null,
    id: "scope-case",
  },
  {
    check: (_, { subject }) =>
      subject && STARTS_WITH_LETTER.test(subject) && startsCapitalised(subject)
        ? "subject must not be sentence-case, start-case, pascal-case, upper-case"
        : null,
    id: "subject-case",
  },
  {
    check: (_, { subject }) => (subject ? null : "subject may not be empty"),
    id: "subject-empty",
  },
  {
    check: (_, { subject }) =>
      subject?.endsWith(".") ? "subject may not end with full stop" : null,
    id: "subject-full-stop",
  },
  {
    check: (_, { type }) =>
      type && !isLowerCase(type) ? "type must be lower-case" : null,
    id: "type-case",
  },
  {
    check: (_, { type }) => (type ? null : "type may not be empty"),
    id: "type-empty",
  },
  {
    check: (_, { type }) =>
      type && !(TYPES as readonly string[]).includes(type)
        ? `type must be one of [${TYPES.join(", ")}]`
        : null,
    id: "type-enum",
  },
]

/** Every rule the header breaks, in the order commitlint prints them. */
export function lint(header: string): readonly Finding[] {
  const parsed = parseHeader(header)
  return RULES.flatMap(({ id, check }) => {
    const message = check(header, parsed)
    return message === null ? [] : [{ message, rule: id }]
  })
}
