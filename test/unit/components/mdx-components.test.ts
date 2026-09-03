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
})
