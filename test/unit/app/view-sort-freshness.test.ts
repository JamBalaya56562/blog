import { describe, expect, test } from "bun:test"
import { readFileSync } from "node:fs"

/**
 * Sorting the blog list by views used to read the counts through a
 * `"use cache"` wrapper, which froze the ranking: measured against a real
 * database, moving a post from 1 view to 500 left the order untouched. The
 * one thing this sort exists to get right was the one thing it could not do.
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
  test("the counts that decide the order are not read from a cache", () => {
    const cachedFunctions = [...SOURCE.matchAll(/async function (\w+)\(/g)]
      .map((match) => match[1])
      .filter((name) => functionBody(SOURCE, name).includes('"use cache"'))

    // Caching the posts themselves is fine and deliberate — parsing MDX on
    // every request would be wasteful. Only the ranking data must stay live.
    for (const name of cachedFunctions) {
      expect(functionBody(SOURCE, name)).not.toContain("getAllViewCounts(")
    }
  })

  test("the list component that sorts is itself dynamic", () => {
    // It reads `searchParams`, so it cannot be cached — which is what makes
    // reading the counts live cost nothing but the query.
    const body = functionBody(SOURCE, "BlogListContent")

    expect(body).toContain("getAllViewCounts(")
    expect(body).not.toContain('"use cache"')
  })
})
