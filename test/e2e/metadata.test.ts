import { expect, test } from "@playwright/test"

/**
 * `openGraph.images` is written as a relative path, so Next resolves it
 * against `metadataBase`. With no base set it silently falls back to
 * `http://localhost:3000` — the build says so and carries on — and every
 * share card in production points at an image only the build machine can
 * fetch. Nothing rendered on the page changes, so only the tags catch it.
 */
test.describe("Share card metadata", () => {
  for (const path of [
    "/en/blog/getting-started-with-nextjs",
    "/ja/blog/getting-started-with-nextjs",
  ]) {
    test(`${path} resolves og:image against the deployed origin`, async ({
      page,
    }) => {
      await page.goto(path)
      const image = await page
        .locator('meta[property="og:image"]')
        .getAttribute("content")

      expect(image).toBeTruthy()
      // Absolute and not the localhost fallback: a relative or localhost URL
      // is exactly what a missing `metadataBase` produces.
      expect(image).toMatch(/^https:\/\//)
      expect(image).not.toContain("localhost")
    })
  }
})

/**
 * The blog list, portfolio and privacy policy all shipped as a bare
 * "Jam's Blog" for a while: their `generateMetadata` returned only
 * `alternates`, so the layout's `title.default` stood in and three unrelated
 * pages were indistinguishable in a search result or a tab strip. The page
 * segment and the layout's `template: "%s | Jam's Blog"` only meet at render
 * time, so this is the level the composition can be checked at.
 */
test.describe("Page titles", () => {
  for (const [path, title] of [
    ["/en", "Jam's Blog"],
    ["/ja", "Jam's Blog"],
    ["/en/blog", "Blog | Jam's Blog"],
    ["/ja/blog", "ブログ | Jam's Blog"],
    ["/en/portfolio", "About Me | Jam's Blog"],
    ["/ja/portfolio", "自己紹介 | Jam's Blog"],
    ["/en/privacy-policy", "Privacy Policy | Jam's Blog"],
    ["/ja/privacy-policy", "プライバシーポリシー | Jam's Blog"],
  ] as const) {
    test(`${path} is titled "${title}"`, async ({ page }) => {
      await page.goto(path)
      await expect(page).toHaveTitle(title)
    })
  }

  test("the subpages do not share the locale root's title", async ({
    page,
  }) => {
    const titles: string[] = []
    for (const path of [
      "/en",
      "/en/blog",
      "/en/portfolio",
      "/en/privacy-policy",
    ]) {
      await page.goto(path)
      titles.push(await page.title())
    }
    expect(new Set(titles).size).toBe(titles.length)
  })
})

/**
 * Every one of these pages used to fall through to the layout's single
 * `description`, so the Japanese pages advertised English text and all four
 * looked like the same document to a crawler. Asserting the exact strings here
 * would just restate the dictionaries, so this pins the properties that made
 * the old state wrong: present, distinct, and in the page's own language.
 */
test.describe("Page descriptions", () => {
  const LAYOUT_DEFAULT =
    "A blog about web development, built with Next.js and MDX."
  const paths = [
    "/en",
    "/ja",
    "/en/blog",
    "/ja/blog",
    "/en/portfolio",
    "/ja/portfolio",
    "/en/privacy-policy",
    "/ja/privacy-policy",
  ]

  for (const path of paths) {
    test(`${path} carries its own description`, async ({ page }) => {
      await page.goto(path)
      const description = await page
        .locator('meta[name="description"]')
        .getAttribute("content")

      expect(description).toBeTruthy()
      expect(description).not.toBe(LAYOUT_DEFAULT)

      // Kana or CJK: the Japanese pages must not be advertising English.
      const hasJapanese = /[ぁ-ヿ一-鿿]/.test(description ?? "")
      expect(hasJapanese).toBe(path.startsWith("/ja"))
    })
  }

  test("no two pages share a description", async ({ page }) => {
    const seen: (string | null)[] = []
    for (const path of paths) {
      await page.goto(path)
      seen.push(
        await page.locator('meta[name="description"]').getAttribute("content"),
      )
    }
    expect(new Set(seen).size).toBe(seen.length)
  })
})

/**
 * These pages shipped with no Open Graph tags at all, and the post pages
 * pointed at a hand-made `thumbnail_default.png` that was 4:3 and off-palette.
 * Every page now renders a generated 1200x630 card, so the thing worth
 * asserting is that the tag exists and the URL behind it really serves an
 * image — a card that 404s looks identical to a missing one in the markup.
 */
test.describe("Open Graph images", () => {
  const paths = [
    "/en",
    "/ja",
    "/en/blog",
    "/ja/blog",
    "/en/portfolio",
    "/ja/portfolio",
    "/en/privacy-policy",
    "/ja/privacy-policy",
    "/en/blog/tailwind-css-v4-guide",
    "/ja/blog/tailwind-css-v4-guide",
  ]

  for (const path of paths) {
    test(`${path} serves a generated card`, async ({ page, request }) => {
      await page.goto(path)

      const image = await page
        .locator('meta[property="og:image"]')
        .getAttribute("content")
      expect(image).toBeTruthy()
      expect(image).toMatch(/^https?:\/\//)
      expect(image).not.toContain("localhost")
      expect(image).not.toContain("thumbnail_default")

      // `metadataBase` resolves og:image against the production origin, so the
      // absolute URL points at the deployed site rather than the server under
      // test. Fetch it back by path, or this asserts against production and
      // 404s for anything not released yet.
      const { pathname, search } = new URL(image ?? "")
      const response = await request.get(`${pathname}${search}`)
      expect(response.status()).toBe(200)
      expect(response.headers()["content-type"]).toContain("image/png")
      expect((await response.body()).length).toBeGreaterThan(1000)
    })
  }

  test("each page gets its own card rather than one shared image", async ({
    page,
  }) => {
    const seen: (string | null)[] = []
    for (const path of paths) {
      await page.goto(path)
      seen.push(
        await page.locator('meta[property="og:image"]').getAttribute("content"),
      )
    }
    expect(new Set(seen).size).toBe(seen.length)
  })
})

/**
 * Every page carried og:title, og:description and og:image but nothing that
 * said what kind of document it was, where it canonically lives, or what
 * language it is in. Posts additionally had no publication date, which is what
 * lets a crawler order them.
 */
test.describe("Open Graph completeness", () => {
  const property = (page: import("@playwright/test").Page, name: string) =>
    page.locator(`meta[property="${name}"]`).getAttribute("content")

  for (const [path, expected] of [
    ["/en/blog", { alternate: "ja_JP", locale: "en_US", type: "website" }],
    ["/ja/portfolio", { alternate: "en_US", locale: "ja_JP", type: "website" }],
  ] as const) {
    test(`${path} declares type, url, site name and locale`, async ({
      page,
    }) => {
      await page.goto(path)

      expect(await property(page, "og:type")).toBe(expected.type)
      expect(await property(page, "og:url")).toBe(
        `https://kokohore56562wanwan.site${path}`,
      )
      expect(await property(page, "og:site_name")).toBeTruthy()
      expect(await property(page, "og:locale")).toBe(expected.locale)
      expect(await property(page, "og:locale:alternate")).toBe(
        expected.alternate,
      )

      const canonical = await page
        .locator('link[rel="canonical"]')
        .getAttribute("href")
      expect(await property(page, "og:url")).toBe(canonical)
    })
  }

  for (const path of [
    "/en/blog/tailwind-css-v4-guide",
    "/ja/blog/tailwind-css-v4-guide",
  ]) {
    test(`${path} is an article with a date and an author`, async ({
      page,
    }) => {
      await page.goto(path)

      expect(await property(page, "og:type")).toBe("article")
      expect(await property(page, "article:published_time")).toMatch(
        /^\d{4}-\d{2}-\d{2}T/,
      )
      expect(await property(page, "article:author")).toBeTruthy()

      const tags = await page
        .locator('meta[property="article:tag"]')
        .evaluateAll((nodes) =>
          nodes.map((n) => n.getAttribute("content") ?? ""),
        )
      expect(tags.length).toBeGreaterThan(0)
    })
  }
})

/**
 * The `alt` export in an `opengraph-image` route is a module constant, so it
 * described every card as "Jam's Blog" regardless of locale or post. It is the
 * text a screen reader announces for a shared link.
 */
test.describe("Open Graph image alt", () => {
  for (const [path, expected] of [
    ["/en/blog", "Blog"],
    ["/ja/blog", "ブログ"],
    ["/en/portfolio", "About Me"],
    ["/ja/portfolio", "自己紹介"],
    ["/en/blog/tailwind-css-v4-guide", "Tailwind CSS v4 Guide"],
    ["/ja/blog/tailwind-css-v4-guide", "Tailwind CSS v4 ガイド"],
  ] as const) {
    test(`${path} describes its card as "${expected}"`, async ({ page }) => {
      await page.goto(path)
      expect(
        await page
          .locator('meta[property="og:image:alt"]')
          .getAttribute("content"),
      ).toBe(expected)
    })
  }

  test("the image the alt describes is really served", async ({
    page,
    request,
  }) => {
    await page.goto("/ja/portfolio")
    const url = await page
      .locator('meta[property="og:image"]')
      .getAttribute("content")
    const { pathname } = new URL(url ?? "")
    const response = await request.get(pathname)
    expect(response.status()).toBe(200)
    expect(response.headers()["content-type"]).toContain("image/png")
  })
})
