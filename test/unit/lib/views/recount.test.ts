import { describe, expect, test } from "bun:test"
import fc from "fast-check"
import { RECOUNT_AFTER_MS, stillCounted } from "@/lib/views/recount"

// Times around now, give or take a few years: wide enough to cross the window
// in every direction, and well inside what `Date` can hold.
const now = fc.integer({ max: 2_000_000_000_000, min: 1_500_000_000_000 })

describe("stillCounted", () => {
  test("a view recorded less than a day ago still counts", () => {
    fc.assert(
      fc.property(
        now,
        fc.integer({ max: RECOUNT_AFTER_MS - 1, min: 0 }),
        (t, elapsed) => stillCounted(String(t - elapsed), t) === true,
      ),
    )
  })

  test("a view recorded a day or more ago counts again", () => {
    fc.assert(
      fc.property(
        now,
        fc.integer({ max: 10 * RECOUNT_AFTER_MS, min: RECOUNT_AFTER_MS }),
        (t, elapsed) => stillCounted(String(t - elapsed), t) === false,
      ),
    )
  })

  // A clock that was ahead when the record was written would otherwise hold
  // it for however far ahead it was.
  test("a record from the future counts again", () => {
    fc.assert(
      fc.property(
        now,
        fc.integer({ max: 10 * RECOUNT_AFTER_MS, min: 1 }),
        (t, ahead) => stillCounted(String(t + ahead), t) === false,
      ),
    )
  })

  test("nothing stored, or nothing that reads as a time, counts again", () => {
    fc.assert(
      fc.property(
        now,
        fc.string().filter((s) => !Number.isFinite(Number(s))),
        (t, junk) =>
          stillCounted(null, t) === false && stillCounted(junk, t) === false,
      ),
    )
  })

  // #1192 stored "1" before records carried a time. Read as a time it is the
  // first millisecond of 1970, so every such record counts once more and is
  // then rewritten with a real one.
  test("a record written before records carried a time counts once more", () => {
    fc.assert(fc.property(now, (t) => stillCounted("1", t) === false))
  })

  test("the window is a day", () => {
    expect(RECOUNT_AFTER_MS).toBe(86_400_000)
  })
})
