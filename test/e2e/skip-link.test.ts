import { expect, test } from "@playwright/test"

/**
 * The header holds four links and two buttons, so reaching the article meant
 * six Tab presses on every page. The skip link is the first thing focus lands
 * on and jumps straight past them.
 *
 * Asserting the markup would prove nothing: the link is `sr-only` until it is
 * focused, so what matters is that it becomes visible and that activating it
 * actually moves focus.
 */
test.describe("Skip to content", () => {
  for (const [path, label] of [
    ["/en", "Skip to content"],
    ["/ja", "本文へスキップ"],
  ] as const) {
    test(`${path} hides the link until it is focused`, async ({ page }) => {
      await page.goto(path)

      const link = page.getByRole("link", { name: label })
      const before = await link.boundingBox()
      expect(before?.width ?? 0).toBeLessThan(2)

      await page.keyboard.press("Tab")
      await expect(link).toBeFocused()

      const after = await link.boundingBox()
      expect(after?.width ?? 0).toBeGreaterThan(20)
      expect(after?.height ?? 0).toBeGreaterThan(10)
    })

    test(`${path} sends focus to the main landmark`, async ({ page }) => {
      await page.goto(path)
      await page.keyboard.press("Tab")
      await page.keyboard.press("Enter")

      await expect(page).toHaveURL(new RegExp(`${path}#main$`))
      const focusedId = await page.evaluate(
        () => document.activeElement?.id ?? "",
      )
      expect(focusedId).toBe("main")
    })
  }

  // Without a tabindex the browser will not move focus into a plain <main>,
  // so the link would scroll but leave the keyboard where it was.
  test("the main landmark can receive focus", async ({ page }) => {
    await page.goto("/en")
    const main = page.locator("main#main")
    await expect(main).toHaveAttribute("tabindex", "-1")
  })

  test("it is the first thing keyboard focus reaches", async ({ page }) => {
    await page.goto("/en")
    await page.keyboard.press("Tab")
    const href = await page.evaluate(
      () => document.activeElement?.getAttribute("href") ?? "",
    )
    expect(href).toBe("#main")
  })
})
