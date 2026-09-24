import type { Page } from "@playwright/test"
import { expect, test } from "@playwright/test"

const POST = "/en/blog/getting-started-with-mise"

type Call = { method: string; status: number; url: string }

/** Every request the page makes to /api/views, with how it was answered. */
function watchViews(page: Page): Call[] {
  const calls: Call[] = []
  page.on("response", (response) => {
    const request = response.request()
    if (new URL(request.url()).pathname === "/api/views") {
      calls.push({
        method: request.method(),
        status: response.status(),
        url: request.url(),
      })
    }
  })
  return calls
}

/**
 * Nothing on the page shows whether the write worked. When nothing reports a
 * count the figure rendered with the page stays, which is also what happens
 * with no database configured — as in this run — so a broken request looks
 * exactly like a working one on screen. These assertions are about the
 * requests instead.
 *
 * A first visit makes two: a POST that records this post's view, and a GET
 * that reads this post's count with its related posts'.
 */
test.describe("View count", () => {
  test("a first visit records the view and reads the counts", async ({
    page,
  }) => {
    const calls = watchViews(page)

    await page.goto(POST)
    await expect
      .poll(() => calls.map((call) => call.method).sort(), { timeout: 10_000 })
      .toEqual(["GET", "POST"])

    expect(calls.every((call) => call.status === 200)).toBe(true)
    const read = calls.find((call) => call.method === "GET")
    expect(new URL(read?.url ?? "").searchParams.getAll("slug")).toContain(
      "getting-started-with-mise",
    )
  })

  // These were Server Actions, which post to the page's own URL with a
  // `Next-Action` header. On a stale prerendered page that path answered 500,
  // and a deploy changed the action IDs under any tab left open. Neither
  // happens to a route of its own, so none should be left.
  test("nothing posts to the page itself", async ({ page }) => {
    const actions: string[] = []
    page.on("request", (request) => {
      if (request.method() === "POST" && request.headers()["next-action"]) {
        actions.push(request.url())
      }
    })

    await page.goto(POST)
    await page.waitForTimeout(1500)

    expect(actions).toEqual([])
  })

  // The reason the write is guarded at all: every mount used to be a view, and
  // a billed DynamoDB write. The record lives in localStorage, so this holds
  // within one browser — which is the whole claim. The read still happens:
  // it is what shows a returning reader the current count.
  test("a second visit in the same browser only reads", async ({ page }) => {
    const calls = watchViews(page)

    await page.goto(POST)
    await expect
      .poll(() => calls.length, { timeout: 10_000 })
      .toBeGreaterThanOrEqual(2)

    calls.length = 0
    await page.goto(POST)
    await expect.poll(() => calls.length, { timeout: 10_000 }).toBe(1)
    await page.waitForTimeout(1000)

    expect(calls.map((call) => call.method)).toEqual(["GET"])
    expect(calls.every((call) => call.status === 200)).toBe(true)
  })

  // The record holds for a day, not for good: a reader who comes back the
  // next day is another view. The day is stood in for by a record written
  // just over a day ago, placed before the page's scripts run.
  test("a visit a day after the last count records again", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        "blog:viewed:getting-started-with-mise",
        String(Date.now() - 24 * 60 * 60 * 1000 - 60_000),
      )
    })
    const calls = watchViews(page)

    await page.goto(POST)
    await expect
      .poll(() => calls.map((call) => call.method).sort(), { timeout: 10_000 })
      .toEqual(["GET", "POST"])
    expect(calls.every((call) => call.status === 200)).toBe(true)
  })
})
