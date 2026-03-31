import { describe, expect, test } from "bun:test"
import { extractToc, slugify, type TocItem } from "@/lib/toc"

describe("slugify", () => {
  test("converts text to lowercase kebab-case", () => {
    expect(slugify("Hello World")).toBe("hello-world")
  })

  test("removes special characters", () => {
    expect(slugify("What's New?")).toBe("whats-new")
  })

  test("collapses multiple spaces", () => {
    expect(slugify("a   b")).toBe("a-b")
  })
})

describe("extractToc", () => {
  test("extracts h2 and h3 headings", () => {
    const md = "## First\n### Second\n## Third"
    expect(extractToc(md)).toEqual([
      { id: "first", text: "First", level: 2 },
      { id: "second", text: "Second", level: 3 },
      { id: "third", text: "Third", level: 2 },
    ] satisfies TocItem[])
  })

  test("ignores h1 and h4+", () => {
    const md = "# Title\n## Included\n#### Ignored"
    expect(extractToc(md)).toEqual([
      { id: "included", text: "Included", level: 2 },
    ])
  })

  test("returns empty array for no headings", () => {
    expect(extractToc("Just a paragraph.")).toEqual([])
  })

  test("deduplicates identical heading ids with suffix", () => {
    const md = "## Setup\n## Setup\n## Setup"
    const items = extractToc(md)
    expect(items.map((i) => i.id)).toEqual(["setup", "setup-1", "setup-2"])
  })

  test("all ids are unique", () => {
    const md = "## A\n## A\n### A\n## B\n## B"
    const ids = extractToc(md).map((i) => i.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
