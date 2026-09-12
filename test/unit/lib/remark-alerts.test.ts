import { describe, expect, test } from "bun:test"
import type { Blockquote, Paragraph, Root, Text } from "mdast"
import { fromMarkdown } from "mdast-util-from-markdown"
import { gfmFromMarkdown } from "mdast-util-gfm"
import { gfm } from "micromark-extension-gfm"
import { ALERT_KINDS, remarkAlerts } from "@/lib/remark-alerts"

function parse(markdown: string): Root {
  const tree = fromMarkdown(markdown, {
    extensions: [gfm()],
    mdastExtensions: [gfmFromMarkdown()],
  })
  remarkAlerts()(tree)
  return tree
}

function firstBlockquote(tree: Root): Blockquote {
  const node = tree.children.find((c) => c.type === "blockquote")
  if (!node) {
    throw new Error("no blockquote in tree")
  }
  return node as Blockquote
}

function alertOf(node: Blockquote): string | undefined {
  const data = node.data as
    | { hProperties?: Record<string, unknown> }
    | undefined
  return data?.hProperties?.["data-alert"] as string | undefined
}

function textOf(node: Blockquote): string {
  return node.children
    .filter((c): c is Paragraph => c.type === "paragraph")
    .flatMap((p) => p.children.filter((c): c is Text => c.type === "text"))
    .map((t) => t.value)
    .join("|")
}

describe("remarkAlerts", () => {
  test("every GitHub kind is recognised and lowercased", () => {
    for (const kind of ALERT_KINDS) {
      const tree = parse(`> [!${kind.toUpperCase()}]\n> Body text.`)
      const quote = firstBlockquote(tree)
      expect(alertOf(quote)).toBe(kind)
      expect(textOf(quote)).toBe("Body text.")
    }
  })

  test("the marker line is removed and nothing else is", () => {
    const tree = parse("> [!NOTE]\n> First line.\n> Second line.")
    expect(textOf(firstBlockquote(tree))).toBe("First line.\nSecond line.")
  })

  test("a marker with nothing after it leaves an empty alert, not a stray paragraph", () => {
    const tree = parse("> [!TIP]")
    const quote = firstBlockquote(tree)
    expect(alertOf(quote)).toBe("tip")
    expect(quote.children).toHaveLength(0)
  })

  test("an ordinary blockquote is left alone", () => {
    const tree = parse("> Just a quote.")
    const quote = firstBlockquote(tree)
    expect(alertOf(quote)).toBeUndefined()
    expect(textOf(quote)).toBe("Just a quote.")
  })

  test("a marker that is not at the very start is literal text", () => {
    const tree = parse("> See [!NOTE] below.")
    const quote = firstBlockquote(tree)
    expect(alertOf(quote)).toBeUndefined()
    expect(textOf(quote)).toBe("See [!NOTE] below.")
  })

  test("an unknown kind is literal text", () => {
    const tree = parse("> [!DANGER]\n> Body.")
    expect(alertOf(firstBlockquote(tree))).toBeUndefined()
  })
})
