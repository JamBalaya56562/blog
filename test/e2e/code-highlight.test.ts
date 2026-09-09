import { expect, test } from "@playwright/test"

const POST = "/en/blog/getting-started-with-nextjs"

/**
 * Code blocks reached the reader as one flat colour: the MDX pipeline named
 * the language in the markup and did nothing with it. The markup alone is not
 * the check — Shiki emits its colours as `--shiki-light` / `--shiki-dark`
 * variables that only become colours once `app/globals.css` picks a side, so
 * only the computed style says whether a reader sees a highlighted block.
 */
test.describe("Code highlighting", () => {
  test("a post's code is tokenised into more than one colour", async ({
    page,
  }) => {
    await page.goto(POST)

    const block = page.locator("pre.shiki").first()
    await expect(block).toBeVisible()

    const colours = await block
      .locator("span[style]")
      .evaluateAll((spans) => [
        ...new Set(spans.map((span) => getComputedStyle(span).color)),
      ])
    expect(colours.length).toBeGreaterThan(2)
  })

  test("the theme reaches the code", async ({ page }) => {
    await page.goto(POST)
    const token = page.locator("pre.shiki span[style]").first()
    await expect(token).toBeVisible()

    await page.evaluate(() => document.documentElement.classList.remove("dark"))
    const light = await token.evaluate((el) => getComputedStyle(el).color)

    await page.evaluate(() => document.documentElement.classList.add("dark"))
    const dark = await token.evaluate((el) => getComputedStyle(el).color)

    expect(light).not.toBe(dark)
  })

  // Shiki also hands over the theme's own background, which would replace the
  // panel every other block on the page sits in. The stylesheet takes the
  // colours and leaves the surface alone.
  test("the block keeps the site's panel background", async ({ page }) => {
    await page.goto(POST)
    await page.evaluate(() => document.documentElement.classList.remove("dark"))

    const block = page.locator("pre.shiki").first()
    const [background, panel] = await block.evaluate((el) => [
      getComputedStyle(el).backgroundColor,
      getComputedStyle(el).getPropertyValue("--cyber-bg-1").trim(),
    ])

    expect(background).not.toBe("rgb(255, 255, 255)")
    expect(panel).not.toBe("")
  })
})
