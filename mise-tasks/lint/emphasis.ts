#!/usr/bin/env bun
//MISE description="Fail on emphasis markers that never became emphasis"
/**
 * Fail on emphasis markers that never became emphasis.
 *
 * CommonMark will not let `**` close a run when it follows punctuation and is
 * followed by a letter, so this ships two literal asterisk pairs:
 *
 *     **It never finished.**The log said this.
 *
 * English prose puts a space after a period and rarely hits it. Japanese puts
 * nothing after 。 or 、, so it hits constantly, and the page is the only place
 * it shows — two of these reached the blog unnoticed. The fix is to close the
 * run before the punctuation: `**It never finished**.`
 *
 * Rather than reimplement the flanking rules, each file is parsed with the
 * parser the site renders with. A marker that became emphasis is a node, not
 * a character, so any asterisk still inside a `text` node is one that did not
 * close. A literal asterisk should be escaped as `\*`.
 */
import { readdirSync, readFileSync } from "node:fs"
import { extname, join, relative } from "node:path"
import { fromMarkdown } from "mdast-util-from-markdown"
import { gfmFromMarkdown } from "mdast-util-gfm"
import { gfm } from "micromark-extension-gfm"
import { visit } from "unist-util-visit"

const ROOT = join(import.meta.dir, "..", "..")
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

// Blanked rather than removed so line numbers below it match the editor's.
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
  // An escaped asterisk parses to the same bare `*` as a failed marker, so the
  // escapes are dropped first. Removing characters within a line keeps the
  // line numbering intact.
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
    "and is followed by a letter.\nClose the run before the punctuation — " +
    "`**text**.` rather than `**text.**` — or escape a literal asterisk as \\*.",
)
process.exit(1)
