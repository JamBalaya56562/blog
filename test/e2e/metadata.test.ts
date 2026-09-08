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
 * segment and the layout's title template only meet at render time, so this is
 * the level the composition can be checked at.
 *
 * The suffix is locale-dependent, and this table used to say "Jam's Blog" on
 * the Japanese rows — it pinned the bug rather than the intent. The layout's
 * title now comes from `header.siteName`, the same dictionary entry
 * `og:site_name` has always used, so the two halves of a Japanese title agree.
 */
test.describe("Page titles", () => {
  for (const [path, title] of [
    ["/en", "Jam's Blog"],
    ["/ja", "Jamのブログ"],
    ["/en/blog", "Blog | Jam's Blog"],
    ["/ja/blog", "ブログ | Jamのブログ"],
    ["/en/portfolio", "About Me | Jam's Blog"],
    ["/ja/portfolio", "自己紹介 | Jamのブログ"],
    ["/en/privacy-policy", "Privacy Policy | Jam's Blog"],
    ["/ja/privacy-policy", "プライバシーポリシー | Jamのブログ"],
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
      // Absent, a crawler dates the post from its own crawl. The frontmatter's
      // `updated` feeds this, falling back to publication for a post nobody
      // has revised — which is the true answer, not a stand-in for one.
      const modified = await property(page, "article:modified_time")
      expect(modified).toMatch(/^\d{4}-\d{2}-\d{2}T/)
      const published = await property(page, "article:published_time")
      expect(
        Date.parse(modified ?? ""),
        "revised before it was published",
      ).toBeGreaterThanOrEqual(Date.parse(published ?? ""))
      expect(await property(page, "article:author")).toBeTruthy()

      const tags = await page
        .locator('meta[property="article:tag"]')
        .evaluateAll((nodes) =>
          nodes.map((n) => n.getAttribute("content") ?? ""),
        )
      expect(tags.length).toBeGreaterThan(0)
    })
  }

  /**
   * The share card is where the two names sat side by side, and where the
   * mismatch was visible to anyone who posted a Japanese page: `og:site_name`
   * read from the dictionary while `og:title` fell through to a hardcoded
   * English default, so one card carried both "Jamのブログ" and "Jam's Blog".
   *
   * Asserting the exact strings would only restate the dictionary. What has to
   * hold is that the site's name is spelled one way per locale, whichever page
   * the crawler landed on.
   */
  for (const [path, siteName] of [
    ["/en", "Jam's Blog"],
    ["/ja", "Jamのブログ"],
    ["/ja/blog", "Jamのブログ"],
    ["/ja/blog/tailwind-css-v4-guide", "Jamのブログ"],
  ] as const) {
    test(`${path} names the site consistently`, async ({ page }) => {
      await page.goto(path)
      expect(await property(page, "og:site_name")).toBe(siteName)
    })
  }

  test("the locale root's og:title is the localised site name", async ({
    page,
  }) => {
    // The root is the one page with no title of its own, so it is the only
    // place `title.default` reaches og:title. That is exactly where the
    // English default used to leak into the Japanese card.
    await page.goto("/ja")
    expect(await property(page, "og:title")).toBe("Jamのブログ")
    expect(await property(page, "og:title")).toBe(
      await property(page, "og:site_name"),
    )
  })
})

/**
 * `x-default` is what a crawler follows for a reader whose language matches
 * neither locale. `proxy.ts` redirects the prefix-less path to the default
 * locale, so that path is the honest answer.
 */
test.describe("hreflang x-default", () => {
  for (const path of ["/en", "/ja", "/en/blog", "/ja/portfolio"]) {
    test(`${path} advertises a prefix-less default`, async ({
      page,
      request,
    }) => {
      await page.goto(path)

      const href = await page
        .locator('link[rel="alternate"][hreflang="x-default"]')
        .getAttribute("href")
      expect(href).toBeTruthy()

      const { pathname } = new URL(href ?? "")
      expect(pathname).not.toMatch(/^\/(en|ja)(\/|$)/)

      // It has to resolve, not 404: a default that dead-ends is worse than none.
      const response = await request.get(pathname)
      expect(response.status()).toBe(200)
    })
  }
})

/**
 * Open Graph is what a share card is built from; structured data is what a
 * search result is built from, and Google does not read Open Graph for it. The
 * site shipped a complete set of the first and none of the second, so these
 * pin the part the unit tests cannot see: that the block survives rendering,
 * parses as JSON, and lands on the page it describes.
 */
test.describe("Structured data", () => {
  const blocks = async (page: import("@playwright/test").Page) =>
    page
      .locator('script[type="application/ld+json"]')
      .evaluateAll((nodes) =>
        nodes.map((n) => JSON.parse(n.textContent ?? "null")),
      )

  test("the locale root describes the site", async ({ page }) => {
    await page.goto("/ja")
    const found = await blocks(page)
    const site = found.find((b) => b["@type"] === "WebSite")
    expect(site, "no WebSite block").toBeTruthy()
    expect(site.name).toBe("Jamのブログ")
    expect(site.inLanguage).toBe("ja")
  })

  for (const [path, locale, headline] of [
    ["/en/blog/tailwind-css-v4-guide", "en", "Tailwind CSS v4 Guide"],
    ["/ja/blog/tailwind-css-v4-guide", "ja", "Tailwind CSS v4 ガイド"],
  ] as const) {
    test(`${path} describes itself as an article`, async ({ page }) => {
      await page.goto(path)
      const found = await blocks(page)

      const article = found.find((b) => b["@type"] === "BlogPosting")
      expect(article, "no BlogPosting block").toBeTruthy()
      expect(article.headline).toBe(headline)
      expect(article.inLanguage).toBe(locale)
      expect(article.datePublished).toMatch(/^\d{4}-\d{2}-\d{2}T/)
      // The block has to claim this page, not an article elsewhere.
      expect(article.mainEntityOfPage["@id"]).toBe(
        `https://kokohore56562wanwan.site${path}`,
      )

      const crumbs = found.find((b) => b["@type"] === "BreadcrumbList")
      expect(crumbs, "no BreadcrumbList block").toBeTruthy()
      expect(crumbs.itemListElement).toHaveLength(3)
      expect(crumbs.itemListElement.at(-1).name).toBe(headline)
    })
  }

  // A page that says nothing is better than a page that says the wrong thing,
  // and a block whose canonical URL is not this page's is the wrong thing.
  test("no block claims a page other than the one it is on", async ({
    page,
  }) => {
    for (const path of ["/en", "/ja", "/ja/blog/tailwind-css-v4-guide"]) {
      await page.goto(path)
      const canonical = await page
        .locator('link[rel="canonical"]')
        .getAttribute("href")

      const found = await blocks(page)
      // Without this the loop below passes on a page carrying no blocks at
      // all, which is the state this whole describe exists to rule out.
      expect(
        found.length,
        `${path} carries no structured data`,
      ).toBeGreaterThan(0)

      for (const block of found) {
        const claimed = block.mainEntityOfPage?.["@id"] ?? block.url
        if (claimed) {
          expect(claimed, `${path} block ${block["@type"]}`).toBe(canonical)
        }
      }
    }
  })
})
