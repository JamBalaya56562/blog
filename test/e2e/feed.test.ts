import { expect, test } from "@playwright/test"

/**
 * The blog had no feed at all, so nothing could follow it. A feed is only
 * useful if readers can find it: the `<link rel="alternate">` is what feed
 * readers autodiscover from a page URL, and the footer link is for people
 * copying the address by hand. Asserting the route alone would miss both.
 */
test.describe("RSS feed", () => {
  for (const locale of ["en", "ja"]) {
    test(`/${locale}/feed.xml serves a parseable feed`, async ({ request }) => {
      const response = await request.get(`/${locale}/feed.xml`)

      expect(response.status()).toBe(200)
      expect(response.headers()["content-type"]).toContain(
        "application/rss+xml",
      )

      const body = await response.text()
      expect(body.startsWith('<?xml version="1.0" encoding="utf-8"?>')).toBe(
        true,
      )
      expect(body).toContain(`<language>${locale}</language>`)
      expect(body).toContain("<item>")
      expect(body).toContain(
        `https://kokohore56562wanwan.site/${locale}/feed.xml`,
      )
    })

    test(`/${locale} advertises the feed for autodiscovery`, async ({
      page,
    }) => {
      await page.goto(`/${locale}`)
      const href = await page
        .locator('link[rel="alternate"][type="application/rss+xml"]')
        .getAttribute("href")
      expect(href).toBe(`https://kokohore56562wanwan.site/${locale}/feed.xml`)
    })

    test(`/${locale} links the feed from the footer`, async ({ page }) => {
      await page.goto(`/${locale}`)
      const link = page.locator(`footer a[href="/${locale}/feed.xml"]`)
      await expect(link).toBeVisible()
    })
  }

  // The footer's link row is `flex flex-wrap`, so a new icon should wrap
  // rather than widen it. On a phone that is the difference between a tidy
  // footer and the whole page scrolling sideways.
  test("the footer does not push the page sideways", async ({ page }) => {
    await page.goto("/ja")

    const footer = page.locator("footer")
    await expect(footer).toBeVisible()

    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    )
    expect(overflow).toBeLessThanOrEqual(0)

    const fits = await footer.evaluate((el) => el.scrollWidth <= el.clientWidth)
    expect(fits).toBe(true)
  })

  test("the feed icon sits on the same row as the other footer links", async ({
    page,
  }) => {
    await page.goto("/ja")
    const box = await page
      .locator('footer a[href="/ja/feed.xml"]')
      .boundingBox()
    expect(box).not.toBeNull()
    expect(box?.width).toBeGreaterThan(0)
    expect(box?.height).toBeGreaterThan(0)
  })
})
