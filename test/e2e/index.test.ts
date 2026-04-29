import { expect, test } from "@playwright/test"

test.describe("Locale redirect", () => {
  test("/ redirects to /en", async ({ page }) => {
    await page.goto("/")
    await expect(page).toHaveURL(/\/en$/)
  })

  test("/blog redirects to /en/blog", async ({ page }) => {
    await page.goto("/blog")
    await expect(page).toHaveURL(/\/en\/blog$/)
  })
})

test.describe("Home page", () => {
  test("shows site name, navigation, and hero section", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto("/en")
    await expect(page).toHaveTitle(/Jam's Blog/)
    await expect(page.locator('header img[alt="Jam\'s Blog"]')).toBeVisible()
    await expect(page.locator("nav")).toContainText("Blog")
    await expect(page.getByText("Making programming")).toBeVisible()
    await expect(page.locator("a[href*='/en/blog/']").first()).toBeVisible()
  })

  test("footer shows copyright", async ({ page }) => {
    await page.goto("/en")
    const year = new Date().getFullYear().toString()
    await expect(page.locator("footer")).toContainText(year)
  })
})

test.describe("Blog list page", () => {
  test("lists all English posts", async ({ page }) => {
    await page.goto("/en/blog")
    await expect(page.getByRole("heading", { name: /^Blog/ })).toBeVisible()
    await expect(page.locator("a[href*='/en/blog/']")).toHaveCount(3)
  })

  test("filters posts by tag", async ({ page }) => {
    await page.goto("/en/blog?tag=typescript")
    // Each post row that has the "typescript" tag also renders an active
    // TagLink, so multiple `[data-active="true"]` elements exist on the
    // page — scope to the first one (the top filter bar chip).
    await expect(
      page.getByRole("main").locator('[data-active="true"]').first(),
    ).toBeVisible()
    // The "ALL" link is what clears the filter — it is rendered as a
    // regular pp-tag chip pointing back to /en/blog (no query string).
    await expect(
      page.getByRole("main").getByRole("link", { name: "ALL", exact: true }),
    ).toBeVisible()
  })

  test("clear filter returns to unfiltered list", async ({ page }) => {
    await page.goto("/en/blog?tag=typescript")
    const allChip = page
      .getByRole("main")
      .getByRole("link", { name: "ALL", exact: true })
    await Promise.all([
      page.waitForURL(/\/en\/blog$/, { timeout: 15000 }),
      allChip.click(),
    ])
  })
})

test.describe("Blog post page", () => {
  test("displays post content and metadata", async ({ page }) => {
    await page.goto("/en/blog/getting-started-with-nextjs")

    await expect(
      page.getByRole("heading", { name: "Getting Started with Next.js" }),
    ).toBeVisible()
    await expect(page.getByText("Posted on")).toBeVisible()
    // Dates are now rendered with dot separators (2025.01.15 instead of
    // 2025-01-15) to match the cyber-style typography.
    await expect(page.getByText("2025.01.15")).toBeVisible()
    await expect(page.locator("a[href*='tag=nextjs']")).toBeVisible()
  })

  test("shows translation link for posts with translations", async ({
    page,
  }) => {
    await page.goto("/en/blog/getting-started-with-nextjs")

    await expect(
      page.getByText("This post is also available in:"),
    ).toBeVisible()
    await expect(
      page
        .getByRole("article")
        .locator("a[href='/ja/blog/getting-started-with-nextjs']"),
    ).toBeVisible()
  })

  test("does not show translation link for posts without translations", async ({
    page,
  }) => {
    await page.goto("/en/blog/tailwind-css-v4-guide")

    await expect(
      page.getByText("This post is also available in:"),
    ).not.toBeVisible()
  })

  test("navigating to translation works", async ({ page }) => {
    await page.goto("/en/blog/getting-started-with-nextjs")

    const translationLink = page
      .getByRole("article")
      .locator("a[href='/ja/blog/getting-started-with-nextjs']")
    await Promise.all([
      page.waitForURL(/\/ja\/blog\/getting-started-with-nextjs/, {
        timeout: 15000,
      }),
      translationLink.click(),
    ])
    await expect(
      page.getByRole("heading", { name: "Next.js入門ガイド" }),
    ).toBeVisible()
  })
})

test.describe("Japanese locale", () => {
  test("home page shows Japanese content", async ({ page }) => {
    await page.goto("/ja")
    await expect(page.locator('header img[alt="Jamのブログ"]')).toBeVisible()
    await expect(page.getByText("プログラミングを")).toBeVisible()
    await expect(page.getByText("もっと身近に。")).toBeVisible()
  })

  test("blog list page shows Japanese heading", async ({ page }) => {
    await page.goto("/ja/blog")
    await expect(page.getByRole("heading", { name: /^ブログ/ })).toBeVisible()
    await expect(page.locator("a[href*='/ja/blog/']")).toHaveCount(2)
  })
})

test.describe("Language switch", () => {
  test("switching from English to Japanese", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto("/en")
    // The desktop locale switcher renders a single "JA / EN" link that
    // toggles to the other locale. The mobile menu uses the dictionary
    // labels ("日本語" / "English") but is hidden at this viewport.
    await Promise.all([
      page.waitForURL(/\/ja$/, { timeout: 15000 }),
      page.getByRole("link", { name: "JA / EN" }).click(),
    ])
    await expect(page.locator('header img[alt="Jamのブログ"]')).toBeVisible()
  })

  test("switching from Japanese to English", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto("/ja")
    await Promise.all([
      page.waitForURL(/\/en$/, { timeout: 15000 }),
      page.getByRole("link", { name: "JA / EN" }).click(),
    ])
    await expect(page.locator('header img[alt="Jam\'s Blog"]')).toBeVisible()
  })
})

test.describe("404", () => {
  test("renders not-found UI for non-existent post", async ({ page }) => {
    // The [slug] route is partially prerendered, so the static shell is
    // served with HTTP 200 and the not-found UI streams in. Assert the
    // rendered content instead of relying on the response status.
    await page.goto("/en/blog/non-existent-post")
    await expect(page.getByText("This page could not be found")).toBeVisible()
  })

  test("returns 404 for invalid locale", async ({ page }) => {
    // Unknown locale is rewritten to /en/{locale} by the proxy, which
    // does not match any prerendered route, so Next.js returns a real
    // 404 status here.
    const response = await page.goto("/fr")
    expect(response?.status()).toBe(404)
  })
})
