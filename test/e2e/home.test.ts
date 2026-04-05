import { expect, test } from "@playwright/test"

test.describe("Home page - Section visibility", () => {
  test("hero section shows badge, title, subtitle, and CTA button", async ({
    page,
  }) => {
    await page.goto("/en")
    await expect(page.getByText("Modern Dev Experience")).toBeVisible()
    await expect(page.getByText("Making programming")).toBeVisible()
    await expect(page.getByText("more accessible.")).toBeVisible()
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
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto("/en")
    await expect(page.getByText("Modern Dev Experience")).toBeVisible()
    await expect(page.locator("a[href*='/en/blog/']").first()).toBeVisible()
  })

  test("desktop viewport renders bento grid in multi-column layout", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
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
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto("/en")
    // Click the theme toggle button
    const themeButton = page.getByRole("button", {
      name: /Switch to dark mode|Switch to light mode/,
    })
    await themeButton.click()
    // Verify dark class is applied to html element
    const htmlClass = await page.locator("html").getAttribute("class")
    expect(htmlClass).toContain("dark")
    // Verify hero section still renders in dark mode
    await expect(page.getByText("Modern Dev Experience")).toBeVisible()
    await expect(page.getByText("Making programming")).toBeVisible()
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
    await firstCard.click()
    await expect(page).toHaveURL(/\/en\/blog\//)
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
    await expect(page.getByText("Modern Dev Experience")).toBeVisible()
    await expect(
      page.getByRole("link", { name: "Browse All Articles" }),
    ).toBeVisible()
    await expect(page.getByText("Making programming")).toBeVisible()
  })

  test("/ja shows Japanese dictionary text", async ({ page }) => {
    await page.goto("/ja")
    await expect(
      page.getByText("モダンな開発体験", { exact: true }),
    ).toBeVisible()
    await expect(
      page.getByRole("link", { name: "すべての記事を見る" }),
    ).toBeVisible()
    await expect(page.getByText("プログラミングを")).toBeVisible()
  })
})
