export type TocItem = { id: string; text: string; level: number }

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
}

export function extractToc(markdown: string): TocItem[] {
  const items: TocItem[] = []
  const counts = new Map<string, number>()
  for (const match of markdown.matchAll(/^(#{2,3})\s+(.+)$/gm)) {
    const text = match[2].trim()
    let id = slugify(text)
    const count = counts.get(id) ?? 0
    counts.set(id, count + 1)
    if (count > 0) {
      id = `${id}-${count}`
    }
    items.push({ id, text, level: match[1].length })
  }
  return items
}
