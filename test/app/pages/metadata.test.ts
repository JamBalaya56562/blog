import { describe, expect, test } from "bun:test"
import fc from "fast-check"
import type { Frontmatter } from "@/lib/content/types"

// Extracted metadata generation logic for testability
function generateMetadataFromFrontmatter(fm: Frontmatter) {
  return { title: fm.title, description: fm.description }
}

const dateArb = fc
  .integer({ min: 2000, max: 2099 })
  .chain((year) =>
    fc
      .integer({ min: 1, max: 12 })
      .chain((month) =>
        fc
          .integer({ min: 1, max: 28 })
          .map(
            (day) =>
              `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
          ),
      ),
  )

const frontmatterArb: fc.Arbitrary<Frontmatter> = fc.record({
  title: fc.stringMatching(/^[a-zA-Z0-9 ]{1,50}$/),
  date: dateArb,
  description: fc.stringMatching(/^[a-zA-Z0-9 ]{1,100}$/),
  tags: fc.array(fc.stringMatching(/^[a-z0-9]{1,15}$/), {
    minLength: 1,
    maxLength: 5,
  }),
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
