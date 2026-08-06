import { describe, expect, test } from "bun:test"
import fc from "fast-check"
import {
  parseFrontmatter,
  serializeFrontmatter,
  validateFrontmatter,
} from "@/lib/content/frontmatter"
import type { Frontmatter } from "@/lib/content/types"

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

  test("Property 3: invalid field types detection", () => {
    const invalidCases: [string, Record<string, unknown>][] = [
      [
        "tags as string",
        { date: "2024-01-01", description: "d", tags: "not-array", title: "t" },
      ],
      [
        "tags with non-string",
        { date: "2024-01-01", description: "d", tags: [1, 2], title: "t" },
      ],
      [
        "title as number",
        { date: "2024-01-01", description: "d", tags: ["a"], title: 123 },
      ],
      [
        "date as number",
        { date: 2024, description: "d", tags: ["a"], title: "t" },
      ],
      [
        "description as bool",
        { date: "2024-01-01", description: false, tags: ["a"], title: "t" },
      ],
    ]
    for (const [label, data] of invalidCases) {
      expect(() => validateFrontmatter(data), label).toThrow()
    }
  })
})
