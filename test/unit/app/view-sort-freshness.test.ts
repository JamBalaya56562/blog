import { describe, expect, test } from "bun:test"
import { readFileSync } from "node:fs"

/**
 * Sorting the blog list by views used to read the counts through a
 * `"use cache"` wrapper with no lifetime of its own, which froze the ranking:
 * measured against a real database, moving a post from 1 view to 500 left the
 * order untouched. The one thing this sort exists to get right was the one
 * thing it could not do.
 *
 * Reading the table on every request instead cost a full read per visit to
 * the sorted list. The counts are cached again now, but for a minute: short
 * enough to rank by, long enough that a burst of visits reads the table once.
 *
 * Nothing errors when it regresses — the list renders, in a plausible order
 * that is simply out of date — so the check has to be structural.
 */
const SOURCE = readFileSync(
  new URL("../../../app/[locale]/blog/page.tsx", import.meta.url),
  "utf8",
)

/**
 * Body of a top-level `async function <name>`, up to the closing brace in
 * column zero. Every function in this file is written that way.
 */
function functionBody(source: string, name: string): string {
  const start = source.indexOf(`async function ${name}(`)
  if (start === -1) {
    throw new Error(`no top-level async function named ${name}`)
  }
  const end = source.indexOf("\n}\n", start)
  if (end === -1) {
    throw new Error(`could not find the end of ${name}`)
  }
  return source.slice(start, end)
}

describe("blog list — view sort freshness", () => {
  test("the counts that decide the order are cached for a minute at most", () => {
    const readers = [...SOURCE.matchAll(/async function (\w+)\(/g)]
      .map((match) => match[1] as string)
      .filter((name) =>
        functionBody(SOURCE, name).includes("getAllViewCounts("),
      )

    expect(readers).toHaveLength(1)
    const body = functionBody(SOURCE, readers[0] as string)

    // A cached read with no lifetime of its own is the frozen ranking. The
    // `minutes` profile revalidates after one; `seconds` would be fresher.
    if (body.includes('"use cache"')) {
      expect(body).toMatch(/cacheLife\("(?:minutes|seconds)"\)/)
    }
  })

  test("the list component that sorts is itself dynamic", () => {
    // It reads `searchParams`, so it cannot be cached as a whole: the counts
    // are all it shares between requests.
    const body = functionBody(SOURCE, "BlogListContent")

    expect(body).toContain("getCachedViewCounts(")
    expect(body).not.toContain('"use cache"')
  })
})
