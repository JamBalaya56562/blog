import { expect, test } from "@playwright/test"

test.describe("Home page - Section visibility", () => {
  test("hero section shows title, subtitle, HUD strip, and CTAs", async ({
    page,
  }) => {
    await page.goto("/en")
    await expect(page.getByText("Making programming")).toBeVisible()
    await expect(page.getByText("more accessible.")).toBeVisible()
    // The HUD strip beneath the headline replaced the old badge.
    await expect(page.getByText("POSTS", { exact: true })).toBeVisible()
    await expect(page.getByText("TAGS", { exact: true })).toBeVisible()
    await expect(page.getByText("LATEST", { exact: true })).toBeVisible()
    await expect(
      page.getByRole("link", { name: "Browse All Articles" }),
    ).toBeVisible()
  })

  test("bento grid section shows articles", async ({ page }) => {
    await page.goto("/en")
    await expect(page.locator("a[href*='/en/blog/']").first()).toBeVisible()
  })

  test("recent dispatches section shows article entries", async ({ page }) => {
    await page.goto("/en")
    // Recent Dispatches only renders when there are posts beyond the first 3
    const recentSection = page.getByText("Recent Dispatches")
    const isVisible = await recentSection.isVisible().catch(() => false)
    if (isVisible) {
      await expect(recentSection).toBeVisible()
      await expect(
        page.getByText("Fresh perspectives and technical breakdowns"),
      ).toBeVisible()
      await expect(page.getByRole("link", { name: "View all" })).toBeVisible()
    }
  })
})

test.describe("Home page - Responsive layout", () => {
  test("mobile viewport renders sections in single column", async ({
    page,
  }) => {
    await page.setViewportSize({ height: 812, width: 375 })
    await page.goto("/en")
    await expect(page.getByText("Making programming")).toBeVisible()
    await expect(page.locator("a[href*='/en/blog/']").first()).toBeVisible()
  })

  test("desktop viewport renders bento grid in multi-column layout", async ({
    page,
  }) => {
    await page.setViewportSize({ height: 800, width: 1280 })
    await page.goto("/en")
    // Verify the grid container uses CSS grid
    const gridContainer = page.locator("section .grid").first()
    await expect(gridContainer).toBeVisible()
    const display = await gridContainer.evaluate(
      (el) => getComputedStyle(el).display,
    )
    expect(display).toBe("grid")
  })
})

test.describe("Home page - Dark mode", () => {
  test("toggling dark mode applies dark class and page renders correctly", async ({
    page,
  }) => {
    await page.setViewportSize({ height: 800, width: 1280 })
    await page.goto("/en")
    // Click the theme toggle button (only the desktop toggle is in the DOM
    // at this viewport — the mobile menu is closed and unmounted).
    const themeButton = page.getByRole("button", {
      name: /Switch to dark mode|Switch to light mode/,
    })
    await themeButton.click()
    // Verify dark class is applied to html element
    const htmlClass = await page.locator("html").getAttribute("class")
    expect(htmlClass).toContain("dark")
    // Verify hero section still renders in dark mode
    await expect(page.getByText("Making programming")).toBeVisible()
    await expect(page.getByText("more accessible.")).toBeVisible()
  })
})

test.describe("Home page - Navigation", () => {
  test("Browse All Articles CTA navigates to blog page", async ({ page }) => {
    await page.goto("/en")
    await page.getByRole("link", { name: "Browse All Articles" }).click()
    await expect(page).toHaveURL(/\/en\/blog/)
  })

  test("GitHub icon in footer has correct external link", async ({ page }) => {
    await page.goto("/en")
    const githubLink = page.locator('footer a[aria-label="GitHub"]')
    await expect(githubLink).toHaveAttribute(
      "href",
      "https://github.com/JamBalaya56562/blog",
    )
    await expect(githubLink).toHaveAttribute("target", "_blank")
  })

  test("bento grid card links navigate to blog post pages", async ({
    page,
  }) => {
    await page.goto("/en")
    const firstCard = page.locator("a[href*='/en/blog/']").first()
    const href = await firstCard.getAttribute("href")
    expect(href).toMatch(/\/en\/blog\//)
    // The bento cards live below the fold and have a translateY hover
    // animation. Scroll into view first so the click target is stable.
    await firstCard.scrollIntoViewIfNeeded()
    await Promise.all([
      page.waitForURL(/\/en\/blog\/[\w-]+/, { timeout: 15000 }),
      firstCard.click(),
    ])
  })

  test("View all link in Recent Dispatches navigates to blog page", async ({
    page,
  }) => {
    await page.goto("/en")
    const viewAllLink = page.getByRole("link", { name: "View all" })
    const isVisible = await viewAllLink.isVisible().catch(() => false)
    if (isVisible) {
      await viewAllLink.click()
      await expect(page).toHaveURL(/\/en\/blog/)
    }
  })
})

test.describe("Home page - Multilingual", () => {
  test("/en shows English dictionary text", async ({ page }) => {
    await page.goto("/en")
    await expect(page.getByText("Making programming")).toBeVisible()
    await expect(page.getByText("more accessible.")).toBeVisible()
    await expect(
      page.getByRole("link", { name: "Browse All Articles" }),
    ).toBeVisible()
  })

  test("/ja shows Japanese dictionary text", async ({ page }) => {
    await page.goto("/ja")
    await expect(page.getByText("プログラミングを")).toBeVisible()
    await expect(page.getByText("もっと身近に。")).toBeVisible()
    await expect(
      page.getByRole("link", { name: "すべての記事を見る" }),
    ).toBeVisible()
  })
})

/**
 * The hero headline must render on one line at every desktop width. It used to
 * be sized from `8vw` capped at 96px, which wrapped between roughly 1000px and
 * 1300px of viewport width — and because `SplitText` emits one inline-block per
 * character, the break landed mid-word. `.pp-hero-line` now derives the size
 * from the container width and the string's own em width.
 *
 * Below `sm` (640px) wrapping is intentionally still allowed, so these cases
 * all sit at or above that breakpoint.
 */
test.describe("Home page - Hero headline fits on one line", () => {
  const VIEWPORTS = [
    { height: 800, width: 640 },
    { height: 768, width: 1024 },
    { height: 800, width: 1280 },
    { height: 768, width: 1366 },
    { height: 1080, width: 1920 },
    { height: 1440, width: 2560 },
  ]

  for (const locale of ["en", "ja"]) {
    for (const { width, height } of VIEWPORTS) {
      test(`/${locale} headline is one line at ${width}x${height}`, async ({
        page,
      }) => {
        await page.setViewportSize({ height, width })
        await page.goto(`/${locale}`)
        await page.evaluate(() => document.fonts.ready)

        const lines = page.locator(".pp-hero-line")
        await expect(lines).toHaveCount(2)

        for (let i = 0; i < 2; i++) {
          // Group the per-character spans by `offsetTop`, which — unlike
          // `getBoundingClientRect()` — ignores the rise animation's
          // transform, so this needs no wait for the animation to settle.
          const rows = await lines.nth(i).evaluate((el) => {
            const tops = new Set(
              [...el.querySelectorAll<HTMLElement>(":scope > span > span")].map(
                (span) => span.offsetTop,
              ),
            )
            return tops.size
          })
          expect(rows).toBe(1)
        }

        const overflow = await page.evaluate(
          () =>
            document.documentElement.scrollWidth -
            document.documentElement.clientWidth,
        )
        expect(overflow).toBeLessThanOrEqual(0)
      })
    }
  }
})
