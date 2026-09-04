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
