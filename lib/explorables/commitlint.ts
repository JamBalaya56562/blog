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

function isLowerCase(value: string): boolean {
  const cleaned = value.replace(/`.*?`|".*?"|'.*?'/g, "").trim()
  return cleaned === "" || cleaned === cleaned.toLowerCase()
}

/**
 * Every rule the header breaks, sorted by rule id — the order commitlint
 * prints them, and the order the article's transcripts show.
 */
export function lint(header: string): readonly Finding[] {
  const { type, scope, subject } = parseHeader(header)
  const findings: Finding[] = []

  if (header.length > HEADER_MAX_LENGTH) {
    findings.push({
      message: `header must not be longer than ${HEADER_MAX_LENGTH} characters, current length is ${header.length}`,
      rule: "header-max-length",
    })
  }
  if (header !== header.trim()) {
    const start = header !== header.trimStart()
    const end = header !== header.trimEnd()
    findings.push({
      message:
        start && end
          ? "header must not be surrounded by whitespace"
          : start
            ? "header must not start with whitespace"
            : "header must not end with whitespace",
      rule: "header-trim",
    })
  }
  if (scope && !scope.split(/[/\\,]/).every(isLowerCase)) {
    findings.push({ message: "scope must be lower-case", rule: "scope-case" })
  }
  if (subject && /^[a-z]/i.test(subject) && startsCapitalised(subject)) {
    findings.push({
      message:
        "subject must not be sentence-case, start-case, pascal-case, upper-case",
      rule: "subject-case",
    })
  }
  if (!subject) {
    findings.push({
      message: "subject may not be empty",
      rule: "subject-empty",
    })
  }
  if (subject?.endsWith(".")) {
    findings.push({
      message: "subject may not end with full stop",
      rule: "subject-full-stop",
    })
  }
  if (type && /^[a-z]/i.test(type) && !isLowerCase(type)) {
    findings.push({ message: "type must be lower-case", rule: "type-case" })
  }
  if (!type) {
    findings.push({ message: "type may not be empty", rule: "type-empty" })
  }
  if (type && !(TYPES as readonly string[]).includes(type)) {
    findings.push({
      message: `type must be one of [${TYPES.join(", ")}]`,
      rule: "type-enum",
    })
  }

  return findings.sort((a, b) =>
    a.rule < b.rule ? -1 : a.rule > b.rule ? 1 : 0,
  )
}
