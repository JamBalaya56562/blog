import { afterEach, describe, expect, test } from "bun:test"
import { displayDate, spokenDate } from "@/lib/i18n/format-date"

/**
 * The site prints `2025.03.01`, which a screen reader reads as digits and dots
 * because nothing in the markup says it is a date. Neither `<time datetime>`
 * nor `aria-label` changes that — the first is not announced, and ARIA
 * prohibits the second on the roles these elements have — so the fix is to
 * give assistive technology different text, which is what this formats.
 */

describe("spokenDate", () => {
  test("reads as a date in Japanese", () => {
    expect(spokenDate("ja", "2025-03-01")).toBe("2025年3月1日")
  })

  test("reads as a date in English", () => {
    expect(spokenDate("en", "2025-03-01")).toBe("March 1, 2025")
  })

  test("differs by locale rather than shipping one language to both", () => {
    expect(spokenDate("ja", "2025-03-01")).not.toBe(
      spokenDate("en", "2025-03-01"),
    )
  })

  // A missing `Intl` locale falls back to English formatting rather than
  // failing, so a runtime built without full ICU would go unnoticed. This is
  // the assertion that would catch it.
  test("Japanese output is actually Japanese, not an English fallback", () => {
    expect(spokenDate("ja", "2025-12-25")).toMatch(
      /^\d{4}年\d{1,2}月\d{1,2}日$/,
    )
  })
})

/**
 * The frontmatter carries a bare `2025-03-01`, which `Date` reads as UTC
 * midnight. Formatted in a timezone behind UTC that is the previous day, so a
 * reader would hear a date the page does not show. `timeZone: "UTC"` pins it,
 * and this is what proves the pin is there: the runner's own timezone is UTC
 * or ahead of it, where the bug is invisible.
 */
describe("spokenDate is not affected by the host timezone", () => {
  const original = process.env.TZ
  afterEach(() => {
    process.env.TZ = original
  })

  for (const tz of ["Pacific/Honolulu", "America/Los_Angeles", "Etc/GMT+12"]) {
    test(`says the same day in ${tz}`, () => {
      process.env.TZ = tz
      expect(spokenDate("en", "2025-03-01")).toBe("March 1, 2025")
      expect(spokenDate("ja", "2025-03-01")).toBe("2025年3月1日")
    })
  }

  for (const tz of ["Asia/Tokyo", "Pacific/Kiritimati"]) {
    test(`says the same day in ${tz}`, () => {
      process.env.TZ = tz
      expect(spokenDate("en", "2025-03-01")).toBe("March 1, 2025")
    })
  }
})

describe("displayDate", () => {
  test("is the dotted form the site shows", () => {
    expect(displayDate("2025-03-01")).toBe("2025.03.01")
  })

  // The two forms are rendered side by side, so they have to describe the same
  // day — a mismatch would be a page that shows one date and says another.
  test("agrees with the spoken form on the day it names", () => {
    for (const iso of [
      "2025-01-15",
      "2025-02-10",
      "2025-03-01",
      "2024-12-31",
    ]) {
      const [year, month, day] = iso.split("-")
      expect(displayDate(iso)).toBe(`${year}.${month}.${day}`)

      const spoken = spokenDate("ja", iso)
      expect(spoken).toContain(`${year}年`)
      expect(spoken).toContain(`${Number(month)}月`)
      expect(spoken).toContain(`${Number(day)}日`)
    }
  })
})
