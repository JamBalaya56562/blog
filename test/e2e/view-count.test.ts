import type { Page } from "@playwright/test"
import { expect, test } from "@playwright/test"

const POST = "/en/blog/getting-started-with-mise"

function watchActions(page: Page): number[] {
  const statuses: number[] = []
  page.on("response", (response) => {
    if (response.request().method() === "POST") {
      statuses.push(response.status())
    }
  })
  return statuses
}

/**
 * Nothing on the page shows whether the write worked. When the action reports
 * nothing the figure rendered with the page stays, which is also what happens
 * with no database configured — as in this run — so a broken action looks
 * exactly like a working one on screen. These assertions are about the
 * requests instead.
 *
 * A load posts twice, not once: the counter writes this post's view and the
 * related-post list reads several counts. Neither the count nor the order is
 * pinned here, only that the writes succeed and that the second visit makes
 * fewer of them.
 */
test.describe("View count", () => {
  test("the writes a page load makes all succeed", async ({ page }) => {
    const statuses = watchActions(page)

    await page.goto(POST)
    await expect
      .poll(() => statuses.length, { timeout: 10_000 })
      .toBeGreaterThan(0)
    await page.waitForTimeout(500)

    expect(statuses.every((status) => status === 200)).toBe(true)
  })

  // The reason the write is guarded at all: every mount used to be a view, and
  // a billed DynamoDB write. The record lives in localStorage, so this holds
  // within one browser — which is the whole claim.
  test("a second visit in the same browser posts less", async ({ page }) => {
    const statuses = watchActions(page)

    await page.goto(POST)
    await expect
      .poll(() => statuses.length, { timeout: 10_000 })
      .toBeGreaterThan(0)
    await page.waitForTimeout(1000)
    const first = statuses.length

    statuses.length = 0
    await page.goto(POST)
    await page.waitForTimeout(1500)

    expect(statuses.length).toBeLessThan(first)
    expect(statuses.every((status) => status === 200)).toBe(true)
  })
})
