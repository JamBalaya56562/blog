import { describe, expect, test } from "bun:test"
import fc from "fast-check"
import { stringify } from "yaml"
import {
  parseFrontmatter,
  validateFrontmatter,
} from "@/lib/content/frontmatter"
import type { Frontmatter } from "@/lib/content/types"

// The generator half of the round-trip property below. It lived in
// `lib/content/frontmatter` but nothing in the app ever wrote frontmatter, so
// it only existed to be the inverse of `parseFrontmatter` here.
function serializeFrontmatter(fm: Frontmatter): string {
  return `---\n${stringify(fm).trim()}\n---`
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

/**
 * `updated` is what `article:modified_time` and JSON-LD's `dateModified` are
 * built from. Before it existed both repeated the publication date, which is
 * true for a post nobody has touched and becomes a false claim the first time
 * one is edited.
 *
 * It is optional on purpose. Absent reads as "never revised", not "unknown",
 * so a post without it still has an honest modified date. What is rejected is
 * an `updated` that cannot be true, since a wrong date is worse than none: it
 * goes to crawlers as fact.
 */
describe("Frontmatter updated", () => {
  const base = {
    date: "2025-01-01",
    description: "d",
    tags: ["a"],
    title: "t",
  }

  test("survives validation rather than being dropped", () => {
    const fm = validateFrontmatter({ ...base, updated: "2025-06-01" })
    expect(fm.updated).toBe("2025-06-01")
  })

  test("is optional, and its absence is not an error", () => {
    const fm = validateFrontmatter(base)
    expect(fm.updated).toBeUndefined()
  })

  test("round-trips through a real document", () => {
    const { frontmatter } = parseFrontmatter(
      `---\ntitle: t\ndate: "2025-01-01"\nupdated: "2025-06-01"\ndescription: d\ntags:\n  - a\n---\n\nBody`,
    )
    expect(frontmatter.updated).toBe("2025-06-01")
  })

  // A year or a month left at the old value is the realistic typo, and it is
  // the one shape of wrongness that can be detected without knowing the truth.
  test("rejects a revision that predates publication", () => {
    expect(() =>
      validateFrontmatter({ ...base, updated: "2024-12-31" }),
    ).toThrow(/before date/)
  })

  test("rejects a value that is not a date", () => {
    expect(() => validateFrontmatter({ ...base, updated: "soon" })).toThrow(
      /not a date/,
    )
    expect(() => validateFrontmatter({ ...base, updated: 20250101 })).toThrow(
      /must be a string/,
    )
  })

  test("accepts a revision on the publication date itself", () => {
    expect(validateFrontmatter({ ...base, updated: base.date }).updated).toBe(
      base.date,
    )
  })
})

/**
 * `image` was declared on `Frontmatter`, read in three components as
 * `post.frontmatter.image ?? DEFAULT_THUMBNAIL`, and never copied into the
 * object `validateFrontmatter` returned. A post could set it and be ignored,
 * with the build, the type checker and the tests all green — the field simply
 * evaporated between the file and the page.
 *
 * No post declared one, so nothing was visibly broken; it was waiting for the
 * first post that wanted its own thumbnail.
 */
describe("Frontmatter image", () => {
  const base = {
    date: "2025-01-01",
    description: "d",
    tags: ["a"],
    title: "t",
  }

  test("reaches the page rather than evaporating", () => {
    const fm = validateFrontmatter({ ...base, image: "/api/images/hero.png" })
    expect(fm.image).toBe("/api/images/hero.png")
  })

  test("is optional, so a post without one still validates", () => {
    expect(validateFrontmatter(base).image).toBeUndefined()
  })

  test("has to be a string, since it is used as an <Image src>", () => {
    expect(() => validateFrontmatter({ ...base, image: 42 })).toThrow(
      /image must be a string/,
    )
  })
})

/**
 * The rule the refactor is meant to hold: the object `validateFrontmatter`
 * returns is the only list of fields there is. A field that survives round trip
 * is in it, and one that does not simply does not exist. Asserting it per field
 * would restate the code, so this asserts the property over every optional
 * field at once — the next one added is covered without touching this file.
 */
describe("no field is silently dropped", () => {
  test("every optional field written is a field read back", () => {
    const written = {
      date: "2025-01-01",
      description: "d",
      image: "/api/images/hero.png",
      tags: ["a"],
      title: "t",
      updated: "2025-06-01",
    }
    const read = validateFrontmatter(written)
    for (const [field, value] of Object.entries(written)) {
      expect(read[field as keyof typeof read], `${field} was dropped`).toEqual(
        value as never,
      )
    }
  })
})
