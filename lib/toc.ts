import type React from "react"

export type TocItem = { id: string; text: string; level: number }

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
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

export function extractToc(markdown: string): TocItem[] {
  const items: TocItem[] = []
  const generateId = createIdGenerator()
  for (const match of markdown.matchAll(/^(#{2,3})\s+(.+)$/gm)) {
    const text = match[2].trim()
    items.push({ id: generateId(text), text, level: match[1].length })
  }
  return items
}
