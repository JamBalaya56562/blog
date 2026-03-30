import { describe, expect, test } from "bun:test"
import fc from "fast-check"
import { useMDXComponents } from "@/mdx-components"

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
  "a",
  "img",
  "blockquote",
  "table",
  "th",
  "td",
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
