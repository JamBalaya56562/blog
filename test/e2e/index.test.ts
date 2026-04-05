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
    await expect(page.getByText("Modern Dev Experience")).toBeVisible()
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
    await expect(page.getByRole("heading", { name: "Blog" })).toBeVisible()
    await expect(page.locator("a[href*='/en/blog/']")).toHaveCount(3)
  })

  test("filters posts by tag", async ({ page }) => {
    await page.goto("/en/blog?tag=typescript")
    await expect(page.getByText("Filtered by tag:")).toBeVisible()
    await expect(page.getByText("Clear filter")).toBeVisible()
  })

  test("clear filter returns to unfiltered list", async ({ page }) => {
    await page.goto("/en/blog?tag=typescript")
    await page.getByText("Clear filter").click()
    await expect(page).toHaveURL(/\/en\/blog$/)
  })
})

test.describe("Blog post page", () => {
  test("displays post content and metadata", async ({ page }) => {
    await page.goto("/en/blog/getting-started-with-nextjs")
    await expect(
      page.getByRole("heading", { name: "Getting Started with Next.js" }),
    ).toBeVisible()
    await expect(page.getByText("Posted on")).toBeVisible()
    await expect(page.getByText("2025-01-15")).toBeVisible()
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
    await page
      .getByRole("article")
      .locator("a[href='/ja/blog/getting-started-with-nextjs']")
      .click()
    await expect(page).toHaveURL(/\/ja\/blog\/getting-started-with-nextjs/)
    await expect(
      page.getByRole("heading", { name: "Next.js入門ガイド" }),
    ).toBeVisible()
  })
})

test.describe("Japanese locale", () => {
  test("home page shows Japanese content", async ({ page }) => {
    await page.goto("/ja")
    await expect(page.locator('header img[alt="Jamのブログ"]')).toBeVisible()
    await expect(page.getByText("モダンな開発体験")).toBeVisible()
  })

  test("blog list page shows Japanese heading", async ({ page }) => {
    await page.goto("/ja/blog")
    await expect(page.getByRole("heading", { name: "ブログ" })).toBeVisible()
    await expect(page.locator("a[href*='/ja/blog/']")).toHaveCount(2)
  })
})

test.describe("Language switch", () => {
  test("switching from English to Japanese", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto("/en")
    await page.getByText("日本語").click()
    await expect(page).toHaveURL(/\/ja$/)
    await expect(page.locator('header img[alt="Jamのブログ"]')).toBeVisible()
  })

  test("switching from Japanese to English", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto("/ja")
    await page.getByText("English").click()
    await expect(page).toHaveURL(/\/en$/)
    await expect(page.locator('header img[alt="Jam\'s Blog"]')).toBeVisible()
  })
})

test.describe("404", () => {
  test("returns 404 for non-existent post", async ({ page }) => {
    const response = await page.goto("/en/blog/non-existent-post")
    expect(response?.status()).toBe(404)
  })

  test("returns 404 for invalid locale", async ({ page }) => {
    const response = await page.goto("/fr")
    expect(response?.status()).toBe(404)
  })
})
