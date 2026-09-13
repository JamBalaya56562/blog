import { expect, test } from "@playwright/test"

/**
 * Every picture in a post is a button that opens the same picture at full
 * size in a native dialog. The dialog is created on the click and rendered
 * into `body`, so before the click there is none in the page at all.
 */
test.describe("Post images open at full size", () => {
  test("click opens the dialog, Escape closes it", async ({ page }) => {
    await page.goto("/ja/blog/getting-started-with-jujutsu")
    const button = page.locator("article button.pp-zoom").first()
    await expect(button).toBeVisible()
    await expect(page.locator("dialog.pp-lightbox")).toHaveCount(0)

    await button.click()
    const dialog = page.locator("dialog.pp-lightbox")
    await expect(dialog).toBeVisible()
    const shown = dialog.locator("img")
    await expect(shown).toBeVisible()
    // The full-size copy is the same file the button shows.
    expect(await shown.getAttribute("src")).toBe(
      await button.locator("img").getAttribute("src"),
    )
    // While it is open the page behind it does not scroll.
    await expect(page.locator("body")).toHaveCSS("overflow", "hidden")

    await page.keyboard.press("Escape")
    await expect(page.locator("dialog.pp-lightbox")).toHaveCount(0)
    await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden")
  })

  test("a click on the backdrop closes it, a click on the picture does not", async ({
    page,
  }) => {
    await page.goto("/ja/blog/getting-started-with-jujutsu")
    await page.locator("article button.pp-zoom").first().click()
    const dialog = page.locator("dialog.pp-lightbox")
    await expect(dialog).toBeVisible()

    await dialog.locator("img").click()
    await expect(dialog).toBeVisible()

    // The dialog covers the viewport; a corner is backdrop, not picture.
    await dialog.click({ position: { x: 4, y: 4 } })
    await expect(page.locator("dialog.pp-lightbox")).toHaveCount(0)
  })
})
