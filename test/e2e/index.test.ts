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
    await page.setViewportSize({ height: 800, width: 1280 })
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
      page.getByRole("main").getByRole("link", { exact: true, name: "ALL" }),
    ).toBeVisible()
  })

  test("clear filter returns to unfiltered list", async ({ page }) => {
    await page.goto("/en/blog?tag=typescript")
    const allChip = page
      .getByRole("main")
      .getByRole("link", { exact: true, name: "ALL" })
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
    // Every post is translated, so this matches the English list above.
    await expect(page.locator("a[href*='/ja/blog/']")).toHaveCount(3)
  })
})

test.describe("Language switch", () => {
  test("switching from English to Japanese", async ({ page }) => {
    await page.setViewportSize({ height: 800, width: 1280 })
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
    await page.setViewportSize({ height: 800, width: 1280 })
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
    // This used to be a soft 404: the shell streamed out at 200 before the
    // slug was known. #1166's `instant = false` on the [slug] route made the
    // status real, so it is worth asserting alongside the UI now.
    const response = await page.goto("/en/blog/non-existent-post")
    expect(response?.status()).toBe(404)
    await expect(page.getByText("SIGNAL LOST")).toBeVisible()
  })

  // A dead end with no way out is the failure mode worth guarding: both
  // routes back have to be there, in whichever locale the reader landed in.
  for (const { locale, home, blog } of [
    { blog: "Blog", home: "RETURN TO HOME", locale: "en" },
    { blog: "ブログ", home: "ホームへ", locale: "ja" },
  ]) {
    test(`offers both ways back in ${locale}`, async ({ page }) => {
      await page.goto(`/${locale}/blog/non-existent-post`)
      const body = page.locator("main")
      await expect(body.getByRole("link", { name: home })).toBeVisible()
      await expect(
        body.getByRole("link", { exact: true, name: blog }),
      ).toBeVisible()
    })
  }

  test("returns 404 for invalid locale", async ({ page }) => {
    // Unknown locale is redirected to /en/{locale} by the proxy and lands on
    // the catch-all in app/[locale]/[...rest], which calls notFound() before
    // the response starts, so this is a real 404 rather than a soft one.
    const response = await page.goto("/fr")
    expect(response?.status()).toBe(404)
  })

  /**
   * An unmatched path used to escape `app/[locale]/` entirely and get Next's
   * built-in "This page could not be found" — no header or footer, English
   * whatever the locale, and the OS colour scheme instead of the reader's
   * theme. `app/[locale]/not-found.tsx` was only ever reached by `notFound()`
   * calls from inside the segment, such as an unknown post slug, which is why
   * the gap survived: the case everyone tests worked.
   *
   * A typo in the URL bar is the common way to see a 404, so it is asserted
   * the same way the post case is.
   */
  for (const path of ["/en/typo", "/typo", "/en/deep/typo/path"]) {
    test(`${path} renders the site's 404, not Next's`, async ({ page }) => {
      const response = await page.goto(path)
      expect(response?.status()).toBe(404)

      await expect(page.getByText("SIGNAL LOST")).toBeVisible()
      await expect(page.locator("header")).toBeVisible()
      await expect(page.locator("footer")).toBeVisible()
      await expect(page.getByText("This page could not be found")).toHaveCount(
        0,
      )
    })
  }

  test("an unmatched path keeps its locale", async ({ page }) => {
    // The built-in page is English-only, so a Japanese reader was dropped into
    // English on a typo. not-found.tsx derives the locale from the pathname.
    await page.goto("/ja/typo")
    await expect(page.getByRole("link", { name: "ホームへ" })).toBeVisible()
  })

  test("an unmatched path follows the reader's theme, not the OS", async ({
    page,
  }) => {
    // The sharpest symptom of rendering outside the layout: ThemeInitScript
    // lives there, so the built-in page ignored a stored preference outright.
    // Emulating dark while the reader has chosen light separates the two.
    await page.emulateMedia({ colorScheme: "dark" })
    await page.goto("/en")
    await page.evaluate(() => localStorage.setItem("theme", "light"))

    await page.goto("/en/typo")
    // Assert the site's own 404 rendered before asserting the theme. Next's
    // built-in page has no class on <html> either, so the negative check alone
    // passes just as well when the fix is gone — it has to be pinned to a page
    // that could have carried the class.
    await expect(page.locator("footer")).toBeVisible()
    await expect(page.locator("html")).not.toHaveClass(/dark/)
  })

  test("the catch-all does not shadow a real route", async ({ page }) => {
    // A catch-all is the router's lowest-priority match, and every sibling
    // route has to keep winning on its own path. Cheap to assert, and the
    // failure would be a blank site rather than a bad 404.
    for (const path of ["/en/blog", "/en/portfolio", "/en/privacy-policy"]) {
      const response = await page.goto(path)
      expect(response?.status(), `${path} was swallowed`).toBe(200)
    }
  })
})
