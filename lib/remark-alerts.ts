import type { Blockquote, Root } from "mdast"
import { visit } from "unist-util-visit"

/**
 * GitHub's alert syntax: a blockquote whose first line is `[!NOTE]`, `[!TIP]`,
 * `[!IMPORTANT]`, `[!WARNING]` or `[!CAUTION]`. remark-gfm leaves the marker
 * as literal text, so this strips it and tags the blockquote instead; the
 * `blockquote` entry in `mdx-components.tsx` reads the tag and draws the
 * callout. Anything else stays an ordinary blockquote.
 */
export const ALERT_KINDS = [
  "note",
  "tip",
  "important",
  "warning",
  "caution",
] as const

export type AlertKind = (typeof ALERT_KINDS)[number]

const MARKER = /^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\][ \t]*(?:\r?\n|$)/

export function remarkAlerts() {
  return (tree: Root) => {
    visit(tree, "blockquote", (node: Blockquote) => {
      const paragraph = node.children[0]
      if (paragraph?.type !== "paragraph") {
        return
      }
      const text = paragraph.children[0]
      if (text?.type !== "text") {
        return
      }
      const match = MARKER.exec(text.value)
      if (!match) {
        return
      }
      const kind = match[1].toLowerCase() as AlertKind
      text.value = text.value.slice(match[0].length)
      // A marker on a line of its own leaves an empty text node behind; drop
      // it, and the paragraph too if the marker was all it held.
      if (text.value === "") {
        paragraph.children.shift()
      }
      if (paragraph.children.length === 0) {
        node.children.shift()
      }
      // `hProperties` is what remark-rehype copies onto the element.
      node.data = {
        ...node.data,
        hProperties: { ...node.data?.hProperties, "data-alert": kind },
      }
    })
  }
}
