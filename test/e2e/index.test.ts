import { expect, test } from "@playwright/test"

/**
 * The posted date of `getting-started-with-mise`, per locale, in both the form
 * that is shown and the form that is spoken. Kept here rather than inline
 * because the assertions below are about how a date is rendered, not about
 * which date it is — rewriting a post should not mean hunting through this
 * file.
 */
const DATES = {
  en: { dotted: "2026.09.10", spoken: "September 10, 2026" },
  ja: { dotted: "2026.09.10", spoken: "2026年9月10日" },
} as const

/**
 * The redirect used to ignore `Accept-Language` and send everyone to `/en`, so
 * a Japanese reader typing the domain landed on the English site and had to
 * find the JA / EN switch. These two tests passed throughout, because the
 * browser Playwright runs happens to ask for English — the language was
 * assumed rather than stated, which is why it is stated now.
 */
test.describe("Locale redirect", () => {
  test.describe("an English browser", () => {
    test.use({ locale: "en-US" })

    test("/ lands on /en", async ({ page }) => {
      await page.goto("/")
      await expect(page).toHaveURL(/\/en$/)
    })

    test("/blog lands on /en/blog", async ({ page }) => {
      await page.goto("/blog")
      await expect(page).toHaveURL(/\/en\/blog$/)
    })
  })

  test.describe("a Japanese browser", () => {
    test.use({ locale: "ja-JP" })

    test("/ lands on /ja", async ({ page }) => {
      await page.goto("/")
      await expect(page).toHaveURL(/\/ja$/)
    })

    test("/blog lands on /ja/blog", async ({ page }) => {
      await page.goto("/blog")
      await expect(page).toHaveURL(/\/ja\/blog$/)
    })
  })

  // Without this, a CDN caches whichever language asked first and serves that
  // redirect to everyone behind it.
  test("the redirect declares what it varies on", async ({ request }) => {
    const response = await request.get("/", {
      headers: { "accept-language": "ja" },
      maxRedirects: 0,
    })

    expect(response.status()).toBe(307)
    expect(response.headers().location).toContain("/ja")
    expect(response.headers().vary?.toLowerCase()).toContain("accept-language")
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
    // Every post carries `mise` at the moment, so this cannot assert that the
    // list got shorter. What it does cover is that a tag in the query string
    // reaches the chips and the rows: an unknown tag renders neither an active
    // chip nor any post, which is the failure this catches.
    await page.goto("/en/blog?tag=nothing-carries-this")
    await expect(page.locator("a[href*='/en/blog/']")).toHaveCount(0)

    await page.goto("/en/blog?tag=mise")
    await expect(page.locator("a[href*='/en/blog/']")).toHaveCount(3)
    // Each post row that has the "mise" tag also renders an active TagLink, so
    // multiple `[data-active="true"]` elements exist on the page — scope to the
    // first one (the top filter bar chip).
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
    await page.goto("/en/blog?tag=mise")
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
    await page.goto("/en/blog/getting-started-with-mise")

    await expect(
      page.getByRole("heading", { name: "Getting Started with mise" }),
    ).toBeVisible()
    // Dates are rendered with dot separators (2026.09.10 instead of
    // 2026-09-10) to match the cyber-style typography. The bare date now
    // appears twice in this row — posted and updated — so it is asserted
    // together with its label rather than on its own.
    await expect(page.locator("article header .pp-tick").nth(1)).toContainText(
      `Posted on ${DATES.en.dotted}`,
    )
    await expect(page.locator("a[href*='tag=mise']")).toBeVisible()
  })

  /**
   * The revision date is shown whether or not the post has been revised: a post
   * with no `updated` really was last modified when it was published, so the
   * fallback is the true date. Every post reads that way today, which is why
   * these assert the order of the two rather than only that both exist — a
   * pair of identical dates would satisfy "both visible" in either order.
   */
  for (const [locale, posted, updated] of [
    ["en", "Posted on", "Updated on"],
    ["ja", "投稿日", "更新日"],
  ] as const) {
    test(`${locale} shows the revision date after the posted date`, async ({
      page,
    }) => {
      await page.goto(`/${locale}/blog/getting-started-with-mise`)

      const meta = page.locator("article header .pp-tick").nth(1)
      // textContent, not innerText: the row is uppercased in CSS, and the
      // labels are only written in one case in the dictionary.
      const text = (await meta.textContent()) ?? ""

      expect(text).toContain(posted)
      expect(text).toContain(updated)
      expect(
        text.indexOf(updated),
        "the revision date is not after the posted date",
      ).toBeGreaterThan(text.indexOf(posted))
      // Both dates read the same until the post is actually revised, so the
      // row carries it twice — splitting on it leaves three pieces.
      expect(text.split(DATES[locale].dotted)).toHaveLength(3)
    })
  }

  /**
   * The meta row now carries a fourth item, and a flat run of items and
   * separators breaks wherever it runs out of width: on a narrow screen it
   * split "1 MIN READ" from "0 VIEWS" and stranded a separator at the start of
   * the next line. The items are grouped so the row breaks between units.
   *
   * Asserting the exact lines would pin the font metrics, so these assert the
   * two properties that made the old layout read badly, at the widths where
   * the row actually has to break.
   */
  for (const width of [390, 360, 320]) {
    // Both locales: the English labels are the longer pair, so English has to
    // break at a width where Japanese still fits, and each catches what the
    // other's line lengths happen to hide.
    for (const [locale, label, readLabel, viewsLabel] of [
      ["en", "Updated on", "MIN READ", "VIEWS"],
      ["ja", "更新日", "分で読める", "回表示"],
    ] as const) {
      test(`the ${locale} meta row breaks between units at ${width}px`, async ({
        page,
      }) => {
        await page.setViewportSize({ height: 800, width })
        await page.goto(`/${locale}/blog/getting-started-with-mise`)

        const meta = page.locator("article header .pp-tick").nth(1)
        await expect(meta).toBeVisible()
        await expect(meta).toContainText(label)

        const lines = await meta.evaluate((el) => {
          const rows = new Map<number, string[]>()
          for (const child of Array.from(el.children) as HTMLElement[]) {
            const top = Math.round(child.getBoundingClientRect().top)
            const key =
              [...rows.keys()].find((k) => Math.abs(k - top) < 5) ?? top
            rows.set(key, [
              ...(rows.get(key) ?? []),
              (child.textContent ?? "").replace(/\s+/g, " ").trim(),
            ])
          }
          return [...rows.entries()]
            .sort((a, b) => a[0] - b[0])
            .map(([, texts]) => texts.join(" "))
        })

        expect(lines.length).toBeGreaterThan(1)
        for (const line of lines) {
          // A line opening with the separator that belongs to the item above.
          expect(line.startsWith("·"), `stranded separator: ${line}`).toBe(
            false,
          )
        }
        // Reading time and view count are one thought and stay on one line.
        const together = lines.find((line) => line.includes(readLabel))
        expect(together, `${readLabel} is on no line`).toBeTruthy()
        expect(together, `views split from read time: ${together}`).toContain(
          viewsLabel,
        )

        const overflows = await page.evaluate(
          () =>
            document.documentElement.scrollWidth >
            document.documentElement.clientWidth,
        )
        expect(overflows, "the page scrolls sideways").toBe(false)
      })
    }
  }

  /**
   * The dates read as digits and dots to a screen reader — "two thousand
   * twenty-five point zero three point zero one" — because nothing in the
   * markup said they were dates. `<time datetime>` does not fix that (it is
   * not announced) and neither does `aria-label` (ARIA prohibits it on the
   * roles these elements have), so the dotted form is hidden from the
   * accessibility tree and a spoken form put beside it.
   *
   * These walk the DOM the way assistive technology reads it — skipping
   * `aria-hidden` subtrees, keeping visually hidden ones — because the whole
   * point is a difference between what is seen and what is announced.
   */
  for (const locale of ["en", "ja"] as const) {
    const { dotted, spoken } = DATES[locale]

    test(`the ${locale} dates are announced as dates`, async ({ page }) => {
      await page.goto(`/${locale}/blog/getting-started-with-mise`)

      const announced = await page.evaluate(() => {
        const walk = (node: Node): string => {
          if (node.nodeType === Node.TEXT_NODE) {
            return node.textContent ?? ""
          }
          const el = node as HTMLElement
          if (el.getAttribute?.("aria-hidden") === "true") {
            return ""
          }
          return Array.from(node.childNodes).map(walk).join("")
        }
        return walk(document.querySelector("main") ?? document.body)
      })

      expect(announced).toContain(spoken)
      // The dotted form is what a screen reader used to be left with.
      expect(
        announced,
        "the dotted date is still in the accessibility tree",
      ).not.toContain(dotted)
    })
  }

  test("the spoken date stays off the screen", async ({ page }) => {
    // The hidden copy must not show up or take space; a broken `sr-only` would
    // print the long date next to the short one.
    await page.setViewportSize({ height: 900, width: 1280 })
    await page.goto("/ja/blog/getting-started-with-mise")

    const hidden = page.locator("article header .sr-only").first()
    await expect(hidden).toHaveText(DATES.ja.spoken)
    const box = await hidden.boundingBox()
    expect(box?.width ?? 0).toBeLessThanOrEqual(1)
    expect(box?.height ?? 0).toBeLessThanOrEqual(1)

    await expect(page.locator("article header .pp-tick").nth(1)).toContainText(
      DATES.ja.dotted,
    )
  })

  test("the desktop meta row is still a single line", async ({ page }) => {
    // The grouping must not change the wide layout: every gap is still the
    // row's own `gap-3`, so this stays one line at any normal width.
    await page.setViewportSize({ height: 900, width: 1280 })
    await page.goto("/en/blog/getting-started-with-mise")

    const meta = page.locator("article header .pp-tick").nth(1)
    const tops = await meta.evaluate((el) =>
      Array.from(el.children).map((c) =>
        Math.round(c.getBoundingClientRect().top),
      ),
    )
    expect(new Set(tops).size, "the row wrapped on desktop").toBe(1)
  })

  test("shows translation link for posts with translations", async ({
    page,
  }) => {
    await page.goto("/en/blog/getting-started-with-mise")

    await expect(
      page.getByText("This post is also available in:"),
    ).toBeVisible()
    await expect(
      page
        .getByRole("article")
        .locator("a[href='/ja/blog/getting-started-with-mise']"),
    ).toBeVisible()
  })

  test("navigating to translation works", async ({ page }) => {
    await page.goto("/en/blog/getting-started-with-mise")

    const translationLink = page
      .getByRole("article")
      .locator("a[href='/ja/blog/getting-started-with-mise']")
    await Promise.all([
      page.waitForURL(/\/ja\/blog\/getting-started-with-mise/, {
        timeout: 15000,
      }),
      translationLink.click(),
    ])
    await expect(
      page.getByRole("heading", { name: "mise 入門ガイド" }),
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
