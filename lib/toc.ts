import type React from "react"

export type TocItem = { id: string; text: string; level: number }

/**
 * `\w` is ASCII-only in JavaScript, even with the `u` flag, so the previous
 * character class deleted every kana and kanji it saw: a heading written only
 * in Japanese slugified to the empty string, which reached the page as `id=""`
 * and left the table of contents pointing at `#`, `#-1`, `#-2`. Matching
 * Unicode letters and numbers instead keeps the heading legible in the anchor,
 * and leaves ASCII headings exactly as they were.
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}_\s-]/gu, "")
    .replace(/\s+/g, "-")
}

export function extractText(node: React.ReactNode): string {
  if (node == null || typeof node === "boolean") {
    return ""
  }
  if (typeof node === "string" || typeof node === "number") {
    return String(node)
  }
  if (Array.isArray(node)) {
    return node.map(extractText).join("")
  }
  if (typeof node === "object" && node !== null && "props" in node) {
    return extractText(
      (node as { props: { children?: React.ReactNode } }).props.children,
    )
  }
  return ""
}

export function createIdGenerator() {
  const counts = new Map<string, number>()
  return (text: string) => {
    const base = slugify(text)
    const count = counts.get(base) ?? 0
    counts.set(base, count + 1)
    return count > 0 ? `${base}-${count}` : base
  }
}

/**
 * The markdown with its fenced code blocks emptied out. A `## ` inside a
 * fence is program output, not a heading — a git-cliff changelog starts with
 * `## [unreleased]` — and it was reaching the index as one. A fence opens
 * with three or more backticks or tildes indented by at most three spaces
 * (four is an indented code block); a backtick opener may not have a backtick
 * in what follows it on the line. It closes with at least as many of the
 * same character, and nothing else, on a line of their own; an unclosed one
 * runs to the end.
 */
function withoutFences(markdown: string): string {
  const kept: string[] = []
  let fence: string | null = null
  for (const line of markdown.split(/\r?\n/)) {
    const [, mark, rest] = line.match(/^ {0,3}(`{3,}|~{3,})(.*)$/) ?? []
    if (fence === null) {
      if (mark && !(mark[0] === "`" && rest.includes("`"))) {
        fence = mark
      } else {
        kept.push(line)
      }
    } else if (
      mark &&
      mark[0] === fence[0] &&
      mark.length >= fence.length &&
      rest.trim() === ""
    ) {
      fence = null
    }
  }
  return kept.join("\n")
}

export function extractToc(markdown: string): TocItem[] {
  const items: TocItem[] = []
  const generateId = createIdGenerator()
  for (const match of withoutFences(markdown).matchAll(/^(#{2,3})\s+(.+)$/gm)) {
    // The index shows the heading as it renders, so inline code loses its
    // backticks. The id is unaffected: `slugify` drops them either way, and
    // the heading in the page is slugified from its rendered text.
    const text = match[2].trim().replace(/`([^`]*)`/g, "$1")
    items.push({ id: generateId(text), level: match[1].length, text })
  }
  return items
}
