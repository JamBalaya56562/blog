import { expect, test } from "@playwright/test"

/**
 * The header ticker's whole point is that it never stops and never visibly
 * restarts. Until now the only assertion on it was that reduced motion stops
 * it — nothing checked that it moves in the first place, so a stylesheet that
 * silently froze it would still have shipped green.
 *
 * These run on every browser project, which is the point: the marquee has
 * only ever been measured in Chromium.
 */

/** Computed animation state and current offset of the ticker track. */
async function trackState(page: import("@playwright/test").Page) {
  return page.locator(".pp-marquee-track").evaluate((el) => {
    const style = getComputedStyle(el)
    return {
      animationName: style.animationName,
      playState: style.animationPlayState,
      x: new DOMMatrixReadOnly(style.transform).m41,
    }
  })
}

test.describe("Header ticker", () => {
  test("keeps scrolling", async ({ page }) => {
    await page.goto("/en")
    await expect(page.locator(".pp-marquee-track")).toBeAttached()

    const before = await trackState(page)
    expect(before.animationName).toBe("ppMarquee")
    expect(before.playState).toBe("running")

    // The offset advances continuously, so any later sample differs.
    await expect.poll(async () => (await trackState(page)).x).not.toBe(before.x)
  })

  test("hovering does not stop it", async ({ page, isMobile }) => {
    test.skip(!!isMobile, "hover is a pointer-device interaction")

    await page.goto("/en")
    const strip = page.locator(".pp-marquee")
    await expect(strip).toBeAttached()
    const box = await strip.boundingBox()
    if (!box) {
      throw new Error("the ticker strip has no layout box")
    }

    // The strip is full-width and sits at the very top of the page under a
    // sticky header, so a resting cursor lands on it constantly. Pausing
    // there once made the ticker look permanently frozen.
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)

    const before = await trackState(page)
    expect(before.playState).toBe("running")
    await expect.poll(async () => (await trackState(page)).x).not.toBe(before.x)
  })

  test("one group covers the viewport and equals exactly one lap", async ({
    page,
  }) => {
    await page.goto("/en")
    const geometry = await page.evaluate(() => {
      const strip = document.querySelector(".pp-marquee")
      const track = document.querySelector(".pp-marquee-track")
      const group = document.querySelector(".pp-marquee-group")
      if (!strip || !track || !group) {
        throw new Error("ticker markup missing")
      }
      return {
        groupCount: document.querySelectorAll(".pp-marquee-group").length,
        groupWidth: group.getBoundingClientRect().width,
        stripWidth: strip.getBoundingClientRect().width,
        trackWidth: track.getBoundingClientRect().width,
      }
    })

    // A group narrower than the strip would send a blank stretch across the
    // ticker part-way through each lap.
    expect(geometry.groupWidth).toBeGreaterThanOrEqual(geometry.stripWidth)

    // The track slides by -50%. That only lands group 2 exactly where group 1
    // started if the two groups are the whole track — the seam is invisible
    // only while this holds.
    expect(geometry.groupCount).toBe(2)
    expect(
      Math.abs(geometry.trackWidth / 2 - geometry.groupWidth),
    ).toBeLessThan(1)
  })
})

test.describe("Header ticker — prefers-reduced-motion", () => {
  test.use({ reducedMotion: "reduce" })

  test("stops", async ({ page }) => {
    await page.goto("/en")
    await expect(page.locator(".pp-marquee-track")).toBeAttached()
    expect((await trackState(page)).animationName).toBe("none")
  })
})
