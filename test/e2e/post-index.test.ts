import { expect, test } from "@playwright/test"

/**
 * The index panel beside a post hangs off the column rather than off the
 * window: a track at `left-full` on the column carries a `sticky` panel. Both
 * halves of that are regressions waiting to happen.
 *
 * Horizontally, the panel used to be `fixed` and find the column's right edge
 * by arithmetic on the viewport width — and which viewport width is the whole
 * question. A classic scrollbar is inside `100vw` and outside the box the
 * column is centred in, so `right: max(1.5rem, calc((100vw - 72rem)/2 - 2rem))`
 * read one width and was applied against the other, and the panel sat half a
 * scrollbar — 7.5px of the usual 15 — inside the column's padding. Playwright's
 * headless shell passes `--hide-scrollbars`, which removes the very difference
 * that is about and makes every form measure the same, so these run with the
 * scrollbar put back.
 *
 * Vertically, `fixed` held the panel on its line to the bottom of the page: it
 * floated over the gap above the footer, indexing a post that was no longer
 * beside it, and the footer hid it only by being painted later. The panel now
 * ends where the column ends, which is what the last test measures.
 */
test.use({ launchOptions: { ignoreDefaultArgs: ["--hide-scrollbars"] } })

test.describe("The index panel beside a post", () => {
  // Every width from the breakpoint up: the drift is a constant, so a wide
  // screen hides it no better than a narrow one, and 1280 is where the panel
  // has the least room to give away.
  for (const width of [1280, 1440, 1920]) {
    test(`is flush with the column's right edge at ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ height: 900, width })
      await page.goto("/en/blog/getting-started-with-mise")

      const panel = page.getByTestId("post-index")
      await expect(panel).toBeVisible()

      const edges = await page.evaluate(() => {
        const nav = document.querySelector<HTMLElement>(
          '[data-testid="post-index"]',
        )
        // The panel hangs off the column's padding box, not off the text, so
        // it is the wrapper around <article> that has to be measured.
        const column = document.querySelector("article")?.parentElement
        if (!nav || !column) {
          return null
        }
        return {
          columnRight: column.getBoundingClientRect().right,
          layoutWidth: document.documentElement.clientWidth,
          panelLeft: nav.getBoundingClientRect().left,
          panelRight: nav.getBoundingClientRect().right,
        }
      })
      if (!edges) {
        throw new Error("the post has no index panel to measure")
      }

      expect(
        Math.abs(edges.panelLeft - edges.columnRight),
        "the panel is not flush with the post's column",
      ).toBeLessThanOrEqual(0.5)
      // The breakpoint is the only thing keeping the panel on screen now
      // that the clamp is gone, so the two are asserted together.
      expect(
        edges.panelRight,
        "the panel runs off the right edge",
      ).toBeLessThanOrEqual(edges.layoutWidth)
    })
  }

  // The other half of the split: the floating panel is for widths that have
  // room beside the column, and the header's button is for the ones that do
  // not. Exactly one of them is ever on screen.
  for (const { width, panel } of [
    { panel: true, width: 1280 },
    { panel: false, width: 1279 },
    { panel: false, width: 390 },
  ]) {
    test(`${width}px shows ${panel ? "the panel" : "the header button"}`, async ({
      page,
    }) => {
      await page.setViewportSize({ height: 900, width })
      await page.goto("/en/blog/getting-started-with-mise")

      await expect(page.getByTestId("post-index")).toBeVisible({
        visible: panel,
      })
      // The button is published by the post once it hydrates, so wait for it
      // to reach the DOM before counting: at `xl` it is there and hidden,
      // which is not the same as never having arrived.
      await expect(
        page.getByTestId("mobile-index-button").first(),
      ).toBeAttached()
      // The header renders the button twice — once in the tab cluster, once
      // beside the hamburger — and hides whichever of the two the width does
      // not call for, so the count of the ones on screen is what says
      // whether the reader has a way in at all.
      const buttons = await page
        .getByTestId("mobile-index-button")
        .evaluateAll(
          (els) => els.filter((el) => el.getClientRects().length > 0).length,
        )
      expect(buttons, "the header's index button").toBe(panel ? 0 : 1)
    })
  }

  // The column's end is the panel's end. Measured as an overhang rather than
  // as visibility, because the two cases the reader sees are different sizes
  // of the same fault: a few pixels into the gap is a panel that outlived its
  // post, and a full panel over the footer is that same panel never having
  // been told to stop.
  test("never reaches past the end of the post's column", async ({ page }) => {
    await page.setViewportSize({ height: 900, width: 1440 })
    await page.goto("/en/blog/getting-started-with-mise")

    const panel = page.getByTestId("post-index")
    await expect(panel).toBeInViewport()

    const columnBottom = await page.evaluate(() => {
      const column = document.querySelector("article")?.parentElement
      return column
        ? column.getBoundingClientRect().bottom + window.scrollY
        : null
    })
    if (columnBottom === null) {
      throw new Error("the post has no column to measure")
    }

    // Where the column's last line sits in the window, from most of a screen
    // below the panel's resting line to above the top of the window: the run
    // through the gap the footer used to cover for.
    for (const columnBottomAt of [800, 400, 128, 0]) {
      await page.evaluate(
        (top) => window.scrollTo({ behavior: "instant", top }),
        columnBottom - columnBottomAt,
      )
      const overhang = await page.evaluate(() => {
        const column = document.querySelector("article")?.parentElement
        const nav = document.querySelector('[data-testid="post-index"]')
        if (!column || !nav) {
          return null
        }
        return (
          nav.getBoundingClientRect().bottom -
          column.getBoundingClientRect().bottom
        )
      })
      expect(
        overhang,
        `the panel hangs below the column with its end at ${columnBottomAt}px`,
      ).toBeLessThanOrEqual(0.5)
    }

    // And with the footer on screen there is nothing left of it to cover.
    await page.evaluate(() =>
      window.scrollTo({
        behavior: "instant",
        top: document.body.scrollHeight,
      }),
    )
    await expect(page.locator("footer")).toBeInViewport()
    await expect(panel).not.toBeInViewport()
  })
})
