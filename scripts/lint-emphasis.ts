#!/usr/bin/env bun
/**
 * Fail on emphasis markers that never became emphasis.
 *
 * CommonMark will not let a `**` close a run when the character before it is
 * punctuation and the character after it is neither whitespace nor punctuation.
 * English prose almost never hits this, because a sentence ends with a period
 * and then a space. Japanese does not put a space after 。 or 、, so writing
 *
 *     **9 分経っても終わりませんでした。**ログにはこう出ていました。
 *
 * ships two literal asterisk pairs to the reader. It looks correct in an editor
 * and only shows up on the rendered page, which is how two of them reached this
 * blog unnoticed. The fix is to leave the punctuation outside the emphasis:
 *
 *     **9 分経っても終わりませんでした**。ログにはこう出ていました。
 *
 * Rather than reimplement the flanking rules, this parses each file with the
 * same markdown parser the site renders with and looks for asterisks left in
 * `text` nodes. A marker that became emphasis is a node type, not a character,
 * so anything still sitting in the text is a marker that did not close.
 *
 * An asterisk meant to be shown literally should be escaped: `\*`.
 */
import { readdirSync, readFileSync } from "node:fs"
import { extname, join, relative } from "node:path"
import { fromMarkdown } from "mdast-util-from-markdown"
import { gfmFromMarkdown } from "mdast-util-gfm"
import { gfm } from "micromark-extension-gfm"
import { visit } from "unist-util-visit"

const ROOT = join(import.meta.dir, "..")
const CONTENT = join(ROOT, "content")

type Finding = { file: string; line: number; text: string }

function markdownFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) {
      return markdownFiles(path)
    }
    return [".md", ".mdx"].includes(extname(entry.name)) ? [path] : []
  })
}

/**
 * Blank out the YAML frontmatter rather than removing it, so the line numbers
 * of everything below stay the ones the author sees in their editor.
 */
function blankFrontmatter(source: string): string {
  const lines = source.split("\n")
  if (lines[0]?.trim() !== "---") {
    return source
  }
  const end = lines.indexOf("---", 1)
  if (end === -1) {
    return source
  }
  return lines.map((line, i) => (i <= end ? "" : line)).join("\n")
}

const findings: Finding[] = []

for (const file of markdownFiles(CONTENT)) {
  // An escaped asterisk is deliberate and parses to a text node holding a bare
  // `*`, which is indistinguishable from a marker that failed to close. Dropping
  // the escapes first leaves only the ones worth reporting; it removes two
  // characters from within a line, so the line numbering is unaffected.
  const source = blankFrontmatter(readFileSync(file, "utf8")).replace(
    /\\\*/g,
    "",
  )
  if (!source.includes("*")) {
    continue
  }

  const tree = fromMarkdown(source, {
    extensions: [gfm()],
    mdastExtensions: [gfmFromMarkdown()],
  })

  visit(tree, "text", (node) => {
    if (!node.value.includes("*")) {
      return
    }
    findings.push({
      file: relative(ROOT, file).replace(/\\/g, "/"),
      line: node.position?.start.line ?? 0,
      text: node.value.split("\n")[0].trim(),
    })
  })
}

if (findings.length === 0) {
  console.log("Success: every emphasis marker renders as emphasis")
  process.exit(0)
}

for (const { file, line, text } of findings) {
  console.error(`${file}:${line}: an asterisk is left in the rendered text`)
  console.error(`  ${text}`)
}
console.error(
  "\nCommonMark will not close emphasis when the marker follows punctuation " +
    "and is followed by a letter.\nMove the punctuation outside — " +
    "`**〜でした**。続き` — or escape a literal asterisk as \\*.",
)
process.exit(1)
