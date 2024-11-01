import { expect, test } from "@playwright/test"

const title: RegExp = /Create Next App/

test("has title", async ({ page }) => {
  await page.goto("/")

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(title)
})
