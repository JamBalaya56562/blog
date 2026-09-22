import { describe, expect, test } from "bun:test"
import fc from "fast-check"
import { fill, formatSeconds } from "@/lib/explorables/format"

const word = fc.stringMatching(/^[a-z][a-z0-9]{0,7}$/)

describe("fill", () => {
  test("Property 1: a template without placeholders comes back unchanged", () => {
    fc.assert(
      fc.property(
        fc.string().filter((s) => !/\{\w+\}/.test(s)),
        fc.dictionary(word, fc.string()),
        (template, vars) => {
          expect(fill(template, vars)).toBe(template)
        },
      ),
      { numRuns: 100 },
    )
  })

  test("Property 2: every placeholder with a value is replaced by it", () => {
    fc.assert(
      fc.property(
        fc.uniqueArray(word, { maxLength: 5, minLength: 1 }),
        fc.array(fc.oneof(fc.string(), fc.integer()), {
          maxLength: 5,
          minLength: 5,
        }),
        (keys, values) => {
          const vars = Object.fromEntries(
            keys.map((key, i) => [key, values[i] as string | number]),
          )
          const template = keys.map((key) => `<{${key}}>`).join(" ")
          const expected = keys.map((key) => `<${String(vars[key])}>`).join(" ")
          expect(fill(template, vars)).toBe(expected)
        },
      ),
      { numRuns: 100 },
    )
  })

  /**
   * A placeholder the figure did not supply stays visible. The templates are
   * written by hand in two languages, and a silent blank is exactly the kind
   * of mistake that survives a read-through.
   */
  test("leaves an unknown placeholder in place", () => {
    expect(fill("{cmd} took {time}", { cmd: "COPY . ." })).toBe(
      "COPY . . took {time}",
    )
  })
})

describe("formatSeconds", () => {
  test("Property 3: minutes and seconds add back up to the input", () => {
    fc.assert(
      fc.property(fc.integer({ max: 100_000, min: 0 }), (seconds) => {
        const text = formatSeconds(seconds)
        const minutes = Number(/(\d+)m/.exec(text)?.[1] ?? 0)
        const rest = Number(/(\d+)s/.exec(text)?.[1] ?? 0)
        expect(minutes * 60 + rest).toBe(seconds)
      }),
      { numRuns: 100 },
    )
  })

  test("rounds to whole seconds and drops an empty seconds part", () => {
    expect(formatSeconds(4.5)).toBe("5s")
    expect(formatSeconds(330)).toBe("5m 30s")
    expect(formatSeconds(480)).toBe("8m")
    expect(formatSeconds(0)).toBe("0s")
  })
})
