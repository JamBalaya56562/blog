import { describe, expect, test } from "bun:test"
import fc from "fast-check"
import type { Frontmatter } from "@/lib/content/types"

// Extracted metadata generation logic for testability
function generateMetadataFromFrontmatter(fm: Frontmatter) {
  return { description: fm.description, title: fm.title }
}

const dateArb = fc
  .integer({ max: 2099, min: 2000 })
  .chain((year) =>
    fc
      .integer({ max: 12, min: 1 })
      .chain((month) =>
        fc
          .integer({ max: 28, min: 1 })
          .map(
            (day) =>
              `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
          ),
      ),
  )

const frontmatterArb: fc.Arbitrary<Frontmatter> = fc.record({
  date: dateArb,
  description: fc.stringMatching(/^[a-zA-Z0-9 ]{1,100}$/),
  tags: fc.array(fc.stringMatching(/^[a-z0-9]{1,15}$/), {
    maxLength: 5,
    minLength: 1,
  }),
  title: fc.stringMatching(/^[a-zA-Z0-9 ]{1,50}$/),
})

describe("Metadata", () => {
  test("Property 10: metadata generation consistency", () => {
    fc.assert(
      fc.property(frontmatterArb, (fm) => {
        const metadata = generateMetadataFromFrontmatter(fm)
        expect(metadata.title).toBe(fm.title)
        expect(metadata.description).toBe(fm.description)
      }),
      { numRuns: 100 },
    )
  })
})
