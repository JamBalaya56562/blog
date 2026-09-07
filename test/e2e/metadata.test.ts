import { expect, test } from "@playwright/test"

/**
 * `openGraph.images` is written as a relative path, so Next resolves it
 * against `metadataBase`. With no base set it silently falls back to
 * `http://localhost:3000` — the build says so and carries on — and every
 * share card in production points at an image only the build machine can
 * fetch. Nothing rendered on the page changes, so only the tags catch it.
 */
test.describe("Share card metadata", () => {
  for (const path of [
    "/en/blog/getting-started-with-nextjs",
    "/ja/blog/getting-started-with-nextjs",
  ]) {
    test(`${path} resolves og:image against the deployed origin`, async ({
      page,
    }) => {
      await page.goto(path)
      const image = await page
        .locator('meta[property="og:image"]')
        .getAttribute("content")

      expect(image).toBeTruthy()
      // Absolute and not the localhost fallback: a relative or localhost URL
      // is exactly what a missing `metadataBase` produces.
      expect(image).toMatch(/^https:\/\//)
      expect(image).not.toContain("localhost")
    })
  }
})

/**
 * The blog list, portfolio and privacy policy all shipped as a bare
 * "Jam's Blog" for a while: their `generateMetadata` returned only
 * `alternates`, so the layout's `title.default` stood in and three unrelated
 * pages were indistinguishable in a search result or a tab strip. The page
 * segment and the layout's `template: "%s | Jam's Blog"` only meet at render
 * time, so this is the level the composition can be checked at.
 */
test.describe("Page titles", () => {
  for (const [path, title] of [
    ["/en", "Jam's Blog"],
    ["/ja", "Jam's Blog"],
    ["/en/blog", "Blog | Jam's Blog"],
    ["/ja/blog", "ブログ | Jam's Blog"],
    ["/en/portfolio", "About Me | Jam's Blog"],
    ["/ja/portfolio", "自己紹介 | Jam's Blog"],
    ["/en/privacy-policy", "Privacy Policy | Jam's Blog"],
    ["/ja/privacy-policy", "プライバシーポリシー | Jam's Blog"],
  ] as const) {
    test(`${path} is titled "${title}"`, async ({ page }) => {
      await page.goto(path)
      await expect(page).toHaveTitle(title)
    })
  }

  test("the subpages do not share the locale root's title", async ({
    page,
  }) => {
    const titles: string[] = []
    for (const path of [
      "/en",
      "/en/blog",
      "/en/portfolio",
      "/en/privacy-policy",
    ]) {
      await page.goto(path)
      titles.push(await page.title())
    }
    expect(new Set(titles).size).toBe(titles.length)
  })
})
