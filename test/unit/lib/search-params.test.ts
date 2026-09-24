import { describe, expect, test } from "bun:test"
import fc from "fast-check"
import { firstParam, type SearchParamValue } from "@/lib/search-params"

/**
 * How Next hands a page one key of its query: nothing when the key is absent,
 * the string when it appears once, and an array when it repeats.
 */
function asNextGivesIt(values: string[]): SearchParamValue {
  if (values.length === 0) {
    return undefined
  }
  return values.length === 1 ? values[0] : values
}

describe("firstParam", () => {
  // `/en/blog?q=a&q=b` reached the list as `q: ["a", "b"]`, and the keyword
  // filter called `.trim()` on it: the page rendered the error boundary.
  test("a repeated key is one string, not an array", () => {
    expect(firstParam(["a", "b"])).toBe("a")
  })

  test("agrees with URLSearchParams.get, which the client reads", () => {
    fc.assert(
      fc.property(fc.array(fc.string(), { maxLength: 5 }), (values) => {
        const query = new URLSearchParams(values.map((v) => ["q", v]))
        expect(firstParam(asNextGivesIt(values)) ?? null).toBe(query.get("q"))
      }),
    )
  })

  test("a single value and an absent key pass through", () => {
    fc.assert(
      fc.property(fc.option(fc.string(), { nil: undefined }), (value) => {
        expect(firstParam(value)).toBe(value)
      }),
    )
  })
})
