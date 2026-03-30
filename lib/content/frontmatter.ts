import { parse, stringify } from "yaml"
import type { Frontmatter } from "./types"

const REQUIRED_FIELDS = ["title", "date", "description", "tags"] as const

export function validateFrontmatter(data: unknown): Frontmatter {
  if (typeof data !== "object" || data === null) {
    throw new Error("Frontmatter must be an object")
  }
  const record = data as Record<string, unknown>
  for (const field of REQUIRED_FIELDS) {
    if (
      !(field in record) ||
      record[field] === undefined ||
      record[field] === null
    ) {
      throw new Error(`Missing required frontmatter field: ${field}`)
    }
  }
  if (typeof record.title !== "string") {
    throw new Error("title must be a string")
  }
  if (typeof record.date !== "string") {
    throw new Error("date must be a string")
  }
  if (typeof record.description !== "string") {
    throw new Error("description must be a string")
  }
  if (
    !Array.isArray(record.tags) ||
    !record.tags.every((t) => typeof t === "string")
  ) {
    throw new Error("tags must be an array of strings")
  }
  return {
    title: record.title,
    date: record.date,
    description: record.description,
    tags: record.tags,
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
  return { frontmatter: validateFrontmatter(parsed), content: match[2].trim() }
}

export function serializeFrontmatter(fm: Frontmatter): string {
  return `---\n${stringify(fm).trim()}\n---`
}
