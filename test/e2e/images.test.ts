import { expect, test } from "@playwright/test"

const POST = "/en/blog/getting-started-with-nextjs"

/**
 * The default thumbnail is the hero of every post and the card of every list
 * entry. It shipped as an 852KB PNG that was lazily loaded and served with
 * `max-age=0`: the largest element in the viewport, fetched late, and fetched
 * again on the next visit. It is now a 7KB AVIF, eager, with a week of
 * caching.
 *
 * AVIF is served without a fallback, so `naturalWidth` is the assertion that
 * matters — it is the one thing that fails if a browser cannot decode the
 * format, where the markup would still look correct.
 */
test.describe("Post images", () => {
  test("the hero decodes and is not deferred", async ({ page }) => {
    await page.goto(POST)

    const hero = page.locator('img[src$="thumbnail_default.avif"]').first()
    await expect(hero).toBeVisible()
    await expect(hero).not.toHaveAttribute("loading", "lazy")
    await expect(hero).toHaveAttribute("fetchpriority", "high")

    const width = await hero.evaluate(
      (img: HTMLImageElement) => img.naturalWidth,
    )
    expect(width).toBeGreaterThan(0)
  })

  test("the thumbnail is cacheable and small", async ({ request }) => {
    const response = await request.get("/thumbnail_default.avif")

    expect(response.status()).toBe(200)
    expect(response.headers()["content-type"]).toBe("image/avif")
    expect(response.headers()["cache-control"]).toContain("max-age=604800")
    expect((await response.body()).length).toBeLessThan(60 * 1024)
  })

  // Body images sit below the fold, and an eager one is preloaded by React
  // ahead of the hero it is competing with.
  test("an image in the article body is deferred", async ({ page }) => {
    await page.goto(POST)

    const inline = page.locator('img[src^="/api/images/"]').first()
    await expect(inline).toHaveAttribute("loading", "lazy")
  })

  // React preloads an eager image, and the body image was eager: the served
  // HTML asked for `/api/images/next.svg` — below the fold, in the article —
  // before the hero it was competing with. Asserted against the HTML rather
  // than the live DOM, because next/image inserts its own preload for the
  // hero after hydration and that one belongs there.
  test("the served HTML does not preload an image from the article body", async ({
    request,
  }) => {
    const html = await (await request.get(POST)).text()

    const preloadedBodyImages = (html.match(/<link[^>]*>/g) ?? []).filter(
      (tag) => tag.includes('rel="preload"') && tag.includes("/api/images/"),
    )

    expect(html).toContain("thumbnail_default.avif")
    expect(preloadedBodyImages).toEqual([])
  })
})
