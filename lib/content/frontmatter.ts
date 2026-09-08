import { parse } from "yaml"
import type { Frontmatter } from "./types"

/**
 * Validation and construction used to be two hand-written lists — a run of
 * `if (typeof record.x !== "string") throw` followed by an object literal
 * naming the fields again — and keeping them in step was left to whoever
 * edited the file.
 *
 * That went wrong exactly the way it looks like it would. `image` is declared
 * on `Frontmatter`, read in three components, and was never copied into the
 * returned object, so a post could set it and be silently ignored. `updated`
 * came within one forgotten line of the same fate.
 *
 * So each field is read once, through a helper that validates and returns in
 * the same step. The returned object is the only list, and a field that is not
 * in it does not exist. That is also what took this function back under
 * CodeFactor's complexity threshold, but the drop-a-field bug is the reason.
 */

function asRecord(data: unknown): Record<string, unknown> {
  if (typeof data !== "object" || data === null) {
    throw new Error("Frontmatter must be an object")
  }
  return data as Record<string, unknown>
}

/** YAML writes a keyless entry as `null`, which is as absent as omitting it. */
function present(record: Record<string, unknown>, field: string): boolean {
  return (
    field in record && record[field] !== undefined && record[field] !== null
  )
}

function requireString(record: Record<string, unknown>, field: string): string {
  if (!present(record, field)) {
    throw new Error(`Missing required frontmatter field: ${field}`)
  }
  const value = record[field]
  if (typeof value !== "string") {
    throw new Error(`${field} must be a string`)
  }
  return value
}

function optionalString(
  record: Record<string, unknown>,
  field: string,
): string | undefined {
  if (!present(record, field)) {
    return undefined
  }
  const value = record[field]
  if (typeof value !== "string") {
    throw new Error(`${field} must be a string`)
  }
  return value
}

function requireStringArray(
  record: Record<string, unknown>,
  field: string,
): string[] {
  if (!present(record, field)) {
    throw new Error(`Missing required frontmatter field: ${field}`)
  }
  const value = record[field]
  if (!Array.isArray(value) || !value.every((v) => typeof v === "string")) {
    throw new Error(`${field} must be an array of strings`)
  }
  return value
}

/**
 * A revision date, which cannot predate the thing it revises. That is the
 * realistic typo — a year or a month left at the old value — and the one shape
 * of wrongness catchable without knowing the truth. A wrong date is worse than
 * no date: it reaches crawlers as fact, indistinguishable from a real one.
 */
function optionalRevisionDate(
  record: Record<string, unknown>,
  field: string,
  notBefore: string,
): string | undefined {
  const value = optionalString(record, field)
  if (value === undefined) {
    return undefined
  }
  if (Number.isNaN(Date.parse(value))) {
    throw new Error(`${field} is not a date: ${value}`)
  }
  if (Date.parse(value) < Date.parse(notBefore)) {
    throw new Error(`${field} (${value}) is before date (${notBefore})`)
  }
  return value
}

export function validateFrontmatter(data: unknown): Frontmatter {
  const record = asRecord(data)
  const date = requireString(record, "date")
  const updated = optionalRevisionDate(record, "updated", date)
  // Used directly as an `<Image src>`, so it wants a path this origin serves —
  // `/api/images/…` or a file under public/. The CSP's `img-src 'self' data:`
  // will block a remote one, and nothing here can warn about that at build time.
  const image = optionalString(record, "image")

  return {
    date,
    description: requireString(record, "description"),
    tags: requireStringArray(record, "tags"),
    title: requireString(record, "title"),
    ...(image === undefined ? {} : { image }),
    ...(updated === undefined ? {} : { updated }),
  }
}

export function parseFrontmatter(raw: string): {
  frontmatter: Frontmatter
  content: string
} {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/)
  if (!match) {
    throw new Error("Invalid frontmatter format")
  }
  const parsed = parse(match[1])
  return { content: match[2].trim(), frontmatter: validateFrontmatter(parsed) }
}
