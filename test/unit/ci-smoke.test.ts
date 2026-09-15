import { expect, test } from "bun:test"

// A throwaway file, never merged. The failing test is there to see what the
// Test workflow's comment holds; the passing one is there to confirm it is
// dropped even though it sits in the same group as the failure.
test("passes, and should not reach the comment", () => {
  expect(1 + 1).toBe(2)
})

test("fails on purpose", () => {
  expect({ colour: "cyan", count: 3 }).toEqual({ colour: "cyan", count: 4 })
})
