import { describe, expect, test } from "bun:test"
import fc from "fast-check"
import { useMDXComponents } from "@/mdx-components"

/**
 * Elements `mdx-components.tsx` must override.
 *
 * `a` and `td` are deliberately absent: `.prose-cyber a` and
 * `.prose-cyber th, td` in app/globals.css set every property those elements
 * need, so an override here would carry no class at all. Re-adding one would
 * also outrank the stylesheet, since `.prose-cyber` sits in
 * `@layer components`.
 */
const REQUIRED_ELEMENTS = [
  "h1",
  "h2",
  "h3",
  "h4",
  "p",
  "ul",
  "ol",
  "li",
  "pre",
  "code",
  "img",
  "blockquote",
  "table",
  "th",
] as const

/**
 * Custom tags the posts write by name. A tag that disappears from the map
 * turns every post that uses it into a build failure; `mdx-tags.test.ts`
 * checks the posts' side of the same contract.
 */
const REQUIRED_COMPONENTS = [
  "BookmarkGraph",
  "CodeTabs",
  "CommitGraph",
  "CommitLint",
  "ContainerLifecycle",
  "LayerCache",
] as const

describe("MDX Components", () => {
  test("Property 5: MDX component completeness", () => {
    fc.assert(
      fc.property(fc.constantFrom(...REQUIRED_ELEMENTS), (element) => {
        const components = useMDXComponents()
        expect(components[element]).toBeDefined()
      }),
      { numRuns: 100 },
    )
  })

  test("Property 6: every custom tag the posts use is mapped", () => {
    fc.assert(
      fc.property(fc.constantFrom(...REQUIRED_COMPONENTS), (name) => {
        const components = useMDXComponents()
        expect(typeof components[name]).toBe("function")
      }),
      { numRuns: 20 },
    )
  })
})
