import { describe, expect, test } from "bun:test"
import fc from "fast-check"
import {
  parseFrontmatter,
  serializeFrontmatter,
  validateFrontmatter,
} from "@/lib/content/frontmatter"
import type { Frontmatter } from "@/lib/content/types"

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

describe("Frontmatter", () => {
  test("Property 1: round-trip consistency", () => {
    fc.assert(
      fc.property(frontmatterArb, (fm) => {
        const serialized = serializeFrontmatter(fm)
        const { frontmatter } = parseFrontmatter(`${serialized}\n\nContent`)
        expect(frontmatter).toEqual(fm)
      }),
      { numRuns: 100 },
    )
  })

  test("Property 2: missing required fields detection", () => {
    const fields = ["title", "date", "description", "tags"] as const
    fc.assert(
      fc.property(
        frontmatterArb,
        fc.subarray([...fields], { minLength: 1 }),
        (fm, fieldsToRemove) => {
          const partial: Record<string, unknown> = { ...fm }
          for (const field of fieldsToRemove) {
            delete partial[field]
          }
          expect(() => validateFrontmatter(partial)).toThrow()
        },
      ),
      { numRuns: 100 },
    )
  })
})
