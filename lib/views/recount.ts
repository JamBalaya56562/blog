/**
 * How long a browser's view of a post stays counted. A reload within it is not
 * another view; a visit the next day is. #1192 made the record permanent, which
 * kept reloads out of the count but also every return visit, so the figure
 * measured how many browsers had ever opened a post rather than how much it is
 * read. A day is the window daily-unique analytics use.
 */
export const RECOUNT_AFTER_MS = 24 * 60 * 60 * 1000

/**
 * Whether a view recorded at `stored` (the value kept in localStorage, in
 * epoch milliseconds) still covers a visit at `now`.
 *
 * Anything that is not a time in the window counts again: nothing stored, the
 * `"1"` #1192 wrote before records carried a time, a value that does not
 * parse, and a time after `now` — a clock that was wrong when it was written
 * would otherwise hold the record for as long as it was off by.
 */
export function stillCounted(stored: string | null, now: number): boolean {
  if (stored === null) {
    return false
  }
  const at = Number(stored)
  if (!Number.isFinite(at)) {
    return false
  }
  const elapsed = now - at
  return elapsed >= 0 && elapsed < RECOUNT_AFTER_MS
}
