import { parse } from "yaml"
import type { Frontmatter } from "./types"

function asRecord(data: unknown): Record<string, unknown> {
  if (typeof data !== "object" || data === null) {
    throw new Error("Frontmatter must be an object")
  }
  return data as Record<string, unknown>
}

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
