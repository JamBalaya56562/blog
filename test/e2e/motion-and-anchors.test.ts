import { expect, test } from "@playwright/test"

const POST = "/en/blog/tailwind-css-v4-guide"

/** Computed animation state of the first hero headline character. */
async function heroChar(page: import("@playwright/test").Page) {
  await expect(page.locator(".pp-split-char").first()).toBeAttached()
  return page
    .locator(".pp-split-char")
    .first()
    .evaluate((el) => {
      const cs = getComputedStyle(el)
      return { animationName: cs.animationName, opacity: cs.opacity }
    })
}

test.describe("Motion — default", () => {
  test("hero headline characters animate in", async ({ page }) => {
    await page.goto("/en")
    expect((await heroChar(page)).animationName).toBe("splitRise")
  })

  test("card scan-line sweeps on hover", async ({ page, isMobile }) => {
    // Touch devices never enter the `:hover` state the sweep hangs off.
    test.skip(!!isMobile, "hover is a pointer-device interaction")
    await page.goto("/en")
    const card = page.locator("a[href*='/en/blog/']").first()
    await card.scrollIntoViewIfNeeded()
    await card.hover()
    const sweep = page.locator(".pp-card-sweep").first()
    await expect(sweep).toBeAttached()
    expect(
      await sweep.evaluate((el) => getComputedStyle(el).animationName),
    ).toBe("ppSweep")
  })
})

test.describe("Motion — prefers-reduced-motion", () => {
  test.use({ reducedMotion: "reduce" })

  // The headline animation carries the characters from `opacity: 0` to 1 with
  // a `forwards` fill, so dropping the animation without restoring the end
  // state would leave the headline invisible. Both halves are asserted.
  test("hero headline is still visible with no animation", async ({ page }) => {
    await page.goto("/en")
    expect(await heroChar(page)).toEqual({
      animationName: "none",
      opacity: "1",
    })
  })

  test("card scan-line does not sweep on hover", async ({ page, isMobile }) => {
    test.skip(!!isMobile, "hover is a pointer-device interaction")
    await page.goto("/en")
    const card = page.locator("a[href*='/en/blog/']").first()
    await card.scrollIntoViewIfNeeded()
    await card.hover()
    const sweep = page.locator(".pp-card-sweep").first()
    await expect(sweep).toBeAttached()
    expect(
      await sweep.evaluate((el) => getComputedStyle(el).animationName),
    ).toBe("none")
  })

  test("the header ticker stops", async ({ page }) => {
    await page.goto("/en")
    const track = page.locator(".pp-marquee-track")
    await expect(track).toBeAttached()
    expect(
      await track.evaluate((el) => getComputedStyle(el).animationName),
    ).toBe("none")
  })
})

test.describe("Anchor targets clear the sticky header", () => {
  test("a heading opened by its fragment is not hidden behind the header", async ({
    page,
  }) => {
    await page.goto(POST)
    const id = await page
      .locator("article h2[id], main h2[id]")
      .first()
      .getAttribute("id")
    if (!id) {
      throw new Error("the post has no heading carrying an id")
    }

    await page.goto(`${POST}#${id}`)
    const { headingTop, headerBottom } = await page.evaluate((anchor) => {
      const el = document.getElementById(anchor)
      const header = document.querySelector("header")
      if (!el || !header) {
        throw new Error("heading or header missing")
      }
      return {
        headerBottom: header.getBoundingClientRect().bottom,
        headingTop: el.getBoundingClientRect().top,
      }
    }, id)

    expect(headingTop).toBeGreaterThanOrEqual(headerBottom)
  })

  test("a table-of-contents click lands below the header", async ({
    page,
    viewport,
  }) => {
    // The table of contents is `hidden xl:block`.
    test.skip(
      (viewport?.width ?? 0) < 1280,
      "table of contents is desktop-only",
    )

    await page.goto(POST)
    const link = page.locator("nav a[href^='#']").first()
    const id = (await link.getAttribute("href"))?.slice(1)
    if (!id) {
      throw new Error("the table of contents has no fragment link")
    }

    await link.click()
    await expect
      .poll(async () =>
        page.evaluate((anchor) => {
          const el = document.getElementById(anchor)
          const header = document.querySelector("header")
          if (!el || !header) {
            return -1
          }
          return (
            el.getBoundingClientRect().top -
            header.getBoundingClientRect().bottom
          )
        }, id),
      )
      .toBeGreaterThanOrEqual(0)
  })
})
