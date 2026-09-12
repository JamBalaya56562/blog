import { describe, expect, test } from "bun:test"
import { createElement } from "react"
import {
  createIdGenerator,
  extractText,
  extractToc,
  slugify,
  type TocItem,
} from "@/lib/toc"

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

  // Every Japanese heading on the site used to slugify to "", so the first one
  // on a page reached the DOM as `id=""` and the rest as `id="-1"`, `id="-2"`.
  test("keeps non-ASCII letters", () => {
    expect(slugify("環境変数が手渡しになっている")).toBe(
      "環境変数が手渡しになっている",
    )
    expect(slugify("mise とは")).toBe("mise-とは")
    expect(slugify("`latest` を書くかどうか")).toBe("latest-を書くかどうか")
  })
})

describe("extractToc", () => {
  test("extracts h2 and h3 headings", () => {
    const md = "## First\n### Second\n## Third"
    expect(extractToc(md)).toEqual([
      { id: "first", level: 2, text: "First" },
      { id: "second", level: 3, text: "Second" },
      { id: "third", level: 2, text: "Third" },
    ] satisfies TocItem[])
  })

  // A heading like "### `--dry-run`" renders without its backticks, and the
  // index should read the same; the id matches the page either way because
  // slugify drops the backticks itself.
  test("inline code in a heading loses its backticks in the index", () => {
    const md = "### `--dry-run`\n## `latest` を書くかどうか"
    expect(extractToc(md)).toEqual([
      { id: "--dry-run", level: 3, text: "--dry-run" },
      { id: "latest-を書くかどうか", level: 2, text: "latest を書くかどうか" },
    ])
  })

  test("ignores h1 and h4+", () => {
    const md = "# Title\n## Included\n#### Ignored"
    expect(extractToc(md)).toEqual([
      { id: "included", level: 2, text: "Included" },
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

describe("extractText", () => {
  test("extracts text from a string", () => {
    expect(extractText("hello")).toBe("hello")
  })

  test("extracts text from nested React elements", () => {
    const node = createElement(
      "span",
      null,
      "Hello ",
      createElement("strong", null, "world"),
    )
    expect(extractText(node)).toBe("Hello world")
  })

  test("handles null and boolean", () => {
    expect(extractText(null)).toBe("")
    expect(extractText(true)).toBe("")
  })
})

describe("createIdGenerator", () => {
  test("generates unique ids for duplicate text", () => {
    const gen = createIdGenerator()
    expect(gen("Setup")).toBe("setup")
    expect(gen("Setup")).toBe("setup-1")
    expect(gen("Setup")).toBe("setup-2")
  })

  test("independent instances do not share state", () => {
    const a = createIdGenerator()
    const b = createIdGenerator()
    a("test")
    expect(b("test")).toBe("test")
  })
})
