import { expect, test } from "@playwright/test"

/**
 * `/sitemap.xml` and `/robots.txt` were both 404 until these route
 * conventions were added, and the sitemap is generated from the content
 * rather than a hand-kept list, so the useful assertions are that it is
 * served at all and that what it advertises actually exists.
 */
test.describe("Crawler metadata", () => {
  test("robots.txt allows crawling and names the sitemap", async ({
    request,
  }) => {
    const response = await request.get("/robots.txt")
    expect(response.status()).toBe(200)

    const body = await response.text()
    expect(body).toContain("User-Agent: *")
    expect(body).toContain("Allow: /")
    expect(body).toMatch(/^Sitemap: https:\/\/\S+\/sitemap\.xml$/m)
  })

  test("the sitemap lists every post in both locales", async ({ request }) => {
    const response = await request.get("/sitemap.xml")
    expect(response.status()).toBe(200)

    const xml = await response.text()
    const locations = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])
    expect(locations.length).toBeGreaterThan(0)

    const postPaths = locations
      .map((url) => new URL(url).pathname)
      .filter((path) => path.includes("/blog/"))
    expect(postPaths.length).toBeGreaterThan(0)

    // Each post must appear once per locale it exists in, and every post is
    // currently translated, so the slugs pair up.
    const slugs = new Set(postPaths.map((path) => path.split("/blog/")[1]))
    for (const slug of slugs) {
      expect(postPaths).toContain(`/en/blog/${slug}`)
      expect(postPaths).toContain(`/ja/blog/${slug}`)
    }
  })

  test("nothing the sitemap advertises is a dead link", async ({ request }) => {
    const xml = await (await request.get("/sitemap.xml")).text()

    // Both the canonical `<loc>` entries and the hreflang alternates. An
    // alternate naming a locale a post was never written in is the trap this
    // guards: it would hand a crawler a 404.
    const urls = new Set([
      ...[...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]),
      ...[...xml.matchAll(/hreflang="[^"]+" href="([^"]+)"/g)].map((m) => m[1]),
    ])

    for (const url of urls) {
      const response = await request.get(new URL(url).pathname)
      expect(
        response.status(),
        `${new URL(url).pathname} is listed in the sitemap`,
      ).toBe(200)
    }
  })
})

test.describe("Canonical and hreflang", () => {
  for (const path of [
    "/en",
    "/ja",
    "/en/blog",
    "/en/portfolio",
    "/en/privacy-policy",
    "/en/blog/tailwind-css-v4-guide",
    "/ja/blog/tailwind-css-v4-guide",
  ]) {
    test(`${path} declares itself canonical and links its translation`, async ({
      page,
    }) => {
      await page.goto(path)

      const canonical = await page
        .locator('link[rel="canonical"]')
        .getAttribute("href")
      expect(new URL(canonical ?? "").pathname).toBe(path)

      // Without these the two locales look like unrelated pages rather than
      // one document in two languages.
      const alternates = await page
        .locator('link[rel="alternate"][hreflang]')
        .evaluateAll((links) =>
          links.map((link) => link.getAttribute("hreflang")),
        )
      expect(alternates).toContain("en")
      expect(alternates).toContain("ja")
    })
  }
})
