import { describe, expect, test } from "bun:test"
import type { Element, Root } from "hast"
import { rehypeHighlight } from "@/lib/highlight"

function codeBlock(lang: string, code: string): Root {
  return {
    children: [
      {
        children: [
          {
            children: [{ type: "text", value: code }],
            properties: { className: [`language-${lang}`] },
            tagName: "code",
            type: "element",
          },
        ],
        properties: {},
        tagName: "pre",
        type: "element",
      },
    ],
    type: "root",
  }
}

async function highlight(lang: string, code: string): Promise<Root> {
  const tree = codeBlock(lang, code)
  // The transformer reads the tree and nothing else, so the file and the
  // callback a full unified run would pass are not needed here.
  const transform = (await rehypeHighlight())() as (tree: Root) => void
  transform(tree)
  return tree
}

type Node = { type: string; children?: Node[] }

// Shiki replaces the `pre` with a fragment, so the highlighted block sits one
// `root` deeper than it was handed over.
function elements(tree: Node): Element[] {
  const found: Element[] = []
  const walk = (node: Node) => {
    for (const child of node.children ?? []) {
      if (child.type === "element") {
        found.push(child as Element)
      }
      walk(child)
    }
  }
  walk(tree)
  return found
}

function styles(tree: Root): string[] {
  return elements(tree)
    .map((el) => el.properties?.style)
    .filter((style): style is string => typeof style === "string")
}

function classesOf(tree: Root, tagName: string): string {
  const el = elements(tree).find((node) => node.tagName === tagName)
  if (!el) {
    throw new Error(`the tree has no ${tagName} element`)
  }
  return [el.properties?.class, el.properties?.className].flat().join(" ")
}

/**
 * Code blocks shipped as one flat colour: the pipeline had `remark-gfm` and
 * no highlighter, so `<pre><code class="language-ts">` reached the reader with
 * the language named in the markup and nothing done about it.
 *
 * The two themes are emitted together as `--shiki-light` / `--shiki-dark` CSS
 * variables rather than as colours, which is what lets `app/globals.css` pick
 * one with the `.dark` class instead of re-highlighting per theme.
 */
describe("code highlighting", () => {
  test("tokens carry a colour for each theme", async () => {
    const tree = await highlight("typescript", "const answer: number = 42")
    const tokens = styles(tree).filter((s) => s.includes("--shiki-light:"))

    expect(tokens.length).toBeGreaterThan(1)
    for (const style of tokens) {
      expect(style).toContain("--shiki-dark:")
    }
  })

  test("the tokens are not all the same colour", async () => {
    const tree = await highlight("typescript", "const answer: number = 42")
    const light = new Set(
      styles(tree).flatMap(
        (s) => s.match(/--shiki-light:(#[0-9a-fA-F]+)/)?.slice(1) ?? [],
      ),
    )

    expect(light.size).toBeGreaterThan(2)
  })

  test("the language survives on the code element", async () => {
    const tree = await highlight("bash", "echo hi")

    expect(classesOf(tree, "code")).toContain("language-bash")
  })

  // A fence naming a language the bundle does not carry is a typo in a post,
  // not a reason to fail the page: it renders unhighlighted instead.
  test("an unbundled language falls back instead of throwing", async () => {
    const tree = await highlight("brainfuck", "++++[>++++<-]")

    expect(classesOf(tree, "pre")).toContain("shiki")
    expect(styles(tree).some((s) => s.includes("--shiki-light:"))).toBe(true)
  })
})
