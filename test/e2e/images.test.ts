import { expect, test } from "@playwright/test"

// This post carries both of the things asserted below: a thumbnail of its own
// rather than the default, and a figure inside the article body.
const POST = "/en/blog/getting-started-with-mise"
const POST_HERO = "/thumbnails/getting-started-with-mise.avif"

/**
 * The hero is the largest element in the viewport on a post, so how it is
 * fetched decides what the reader waits for. It shipped as an 852KB PNG,
 * lazily loaded and served with `max-age=0`: fetched late, and fetched again
 * on the next visit. Posts now carry their own AVIF, eager, with a week of
 * caching, and posts without one still fall back to the default.
 *
 * AVIF is served without a fallback, so `naturalWidth` is the assertion that
 * matters — it is the one thing that fails if a browser cannot decode the
 * format, where the markup would still look correct.
 */
test.describe("Post images", () => {
  test("the hero decodes and is not deferred", async ({ page }) => {
    await page.goto(POST)

    const hero = page.locator("main img").first()
    await expect(hero).toBeVisible()
    await expect(hero).not.toHaveAttribute("loading", "lazy")
    await expect(hero).toHaveAttribute("fetchpriority", "high")

    const width = await hero.evaluate(
      (img: HTMLImageElement) => img.naturalWidth,
    )
    expect(width).toBeGreaterThan(0)
  })

  /**
   * One thumbnail is drawn once and shown in three places, so the three have
   * to ask for the same shape. The hero was 21:9 while the cards and the list
   * rows were 16:9, which meant a picture composed for the card lost its top
   * and bottom on the post — and no thumbnail can be drawn to satisfy both.
   */
  test("the hero and the cards frame the image identically", async ({
    page,
  }) => {
    const ratioOf = async (path: string, selector: string) => {
      await page.goto(path)
      // Both surfaces stream their content in from a Suspense boundary, so
      // `goto` resolving is not the same as the image existing. Measuring
      // without this waits on nothing and fails on whichever engine is
      // slowest that day.
      const image = page.locator(selector).first()
      await expect(image).toBeVisible()
      const box = await image.boundingBox()
      if (!box) {
        throw new Error(`no ${selector} on ${path}`)
      }
      return box.width / box.height
    }

    const hero = await ratioOf(POST, "main img")
    const card = await ratioOf("/en", `img[src="${POST_HERO}"]`)

    expect(hero).toBeCloseTo(16 / 9, 1)
    expect(card).toBeCloseTo(hero, 1)
  })

  /**
   * The portrait is AVIF with no fallback, the same as the heroes, and it is
   * the one image a reader meets outside the blog. It is also `priority`, so a
   * bad encode is the first thing that fails to appear on the page. The markup
   * looks right either way, which is why this asserts on `naturalWidth`.
   */
  test("the portfolio portrait decodes", async ({ page }) => {
    await page.goto("/en/portfolio")

    const portrait = page.locator('img[src="/jambalaya.avif"]')
    await expect(portrait).toBeVisible()

    const width = await portrait.evaluate(
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
  // HTML asked for the article's own figure — below the fold — before the hero
  // it was competing with. Asserted against the HTML rather than the live DOM,
  // because next/image inserts its own preload for the hero after hydration and
  // that one belongs there.
  test("the served HTML does not preload an image from the article body", async ({
    request,
  }) => {
    const html = await (await request.get(POST)).text()

    const preloadedBodyImages = (html.match(/<link[^>]*>/g) ?? []).filter(
      (tag) => tag.includes('rel="preload"') && tag.includes("/api/images/"),
    )

    // The hero has to be in the served HTML for the assertion below to mean
    // anything: a page with no hero preloads nothing either.
    expect(html).toContain(POST_HERO)
    expect(preloadedBodyImages).toEqual([])
  })
})
