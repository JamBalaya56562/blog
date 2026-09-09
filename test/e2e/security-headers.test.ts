import { expect, type Page, test } from "@playwright/test"

/**
 * The site shipped with no security headers at all, so this file is the
 * contract for the ones it now sends.
 *
 * Two things here are easy to get wrong and are checked deliberately:
 *
 * Coverage. `proxy.ts`'s matcher excludes feed.xml, sitemap.xml, robots.txt,
 * /api/images/* and _next/static, so only `next.config.ts`'s `headers()` can
 * reach them. Each of those paths is asserted on its own rather than trusting
 * one representative page.
 *
 * Absence of the TLS-only directives. Playwright drives the production build
 * over plain http://localhost:3000, so `upgrade-insecure-requests` would break
 * every other e2e file. HSTS is the opposite case: browsers ignore it when it
 * arrives over http, so sending it is free and still worth asserting.
 */

const EXACT_HEADERS: ReadonlyArray<readonly [string, string]> = [
  ["x-content-type-options", "nosniff"],
  ["x-frame-options", "DENY"],
  ["referrer-policy", "strict-origin-when-cross-origin"],
  ["strict-transport-security", "max-age=31536000; includeSubDomains"],
]

const COVERED_PATHS = [
  "/en",
  "/ja",
  "/en/blog",
  "/en/feed.xml",
  "/sitemap.xml",
  "/robots.txt",
  "/manifest.webmanifest",
]

function parseCsp(csp: string | undefined): Map<string, string> {
  return new Map(
    (csp ?? "")
      .split(";")
      .map((directive) => directive.trim())
      .filter(Boolean)
      .map((directive) => {
        const [name, ...values] = directive.split(/\s+/)
        return [name, values.join(" ")] as const
      }),
  )
}

test.describe("Security headers", () => {
  for (const path of COVERED_PATHS) {
    test(`${path} carries the security header set`, async ({ request }) => {
      const response = await request.get(path)
      expect(response.status()).toBe(200)

      const headers = response.headers()
      for (const [key, value] of EXACT_HEADERS) {
        expect(headers[key], `${path} is missing or wrong: ${key}`).toBe(value)
      }
      expect(headers["content-security-policy"]).toBeTruthy()

      const permissions = headers["permissions-policy"] ?? ""
      for (const feature of [
        "camera=()",
        "geolocation=()",
        "microphone=()",
        "payment=()",
        "usb=()",
      ]) {
        expect(permissions, `${path} permissions-policy`).toContain(feature)
      }

      expect(headers["x-powered-by"]).toBeUndefined()
    })
  }

  test("the site policy is exactly what we intend", async ({ request }) => {
    const csp = (await request.get("/en")).headers()["content-security-policy"]
    const directives = parseCsp(csp)

    expect(directives.get("default-src")).toBe("'self'")
    // Partial prerendering rules out a nonce, so inline script stays allowed.
    // The reasoning is in next.config.ts.
    expect(directives.get("script-src")).toBe("'self' 'unsafe-inline'")
    // `script-src` cannot drop 'unsafe-inline', so this directive is the only
    // part of the script policy an injection actually runs into. Losing it
    // would be silent: nothing renders differently either way.
    expect(directives.get("script-src-attr")).toBe("'none'")
    // Dropped its 'unsafe-inline' when the stylesheet stopped being inlined
    // into the document. Style *attributes* are a separate directive and are
    // still allowed; see below.
    expect(directives.get("style-src")).toBe("'self'")
    expect(directives.get("img-src")).toBe("'self' data:")
    expect(directives.get("font-src")).toBe("'self'")
    expect(directives.get("connect-src")).toBe("'self'")
    expect(directives.get("manifest-src")).toBe("'self'")
    expect(directives.get("base-uri")).toBe("'self'")
    expect(directives.get("form-action")).toBe("'self'")
    expect(directives.get("frame-ancestors")).toBe("'none'")
    expect(directives.get("object-src")).toBe("'none'")
    expect(directives.get("frame-src")).toBe("'none'")
    expect(directives.get("media-src")).toBe("'none'")
    expect(directives.get("worker-src")).toBe("'none'")

    // A development relaxation reaching a release build would gut the policy
    // without any visible symptom, so fail loudly on it.
    expect(csp).not.toContain("'unsafe-eval'")
    expect(csp).not.toContain("ws:")
    // Playwright drives plain http. An upgrade directive buys nothing here
    // (there is not one http:// subresource) and the localhost carve-outs
    // differ between engines.
    expect(csp).not.toContain("upgrade-insecure-requests")
  })

  test("the locale redirect carries them too", async ({ request }) => {
    const response = await request.get("/", { maxRedirects: 0 })
    expect(response.status()).toBe(307)
    expect(response.headers()["strict-transport-security"]).toBe(
      "max-age=31536000; includeSubDomains",
    )
    expect(response.headers()["content-security-policy"]).toBeTruthy()
  })

  test("hashed _next/static assets are covered", async ({ page, request }) => {
    // proxy.ts's matcher excludes _next/static outright, so this asserts the
    // one thing only next.config.ts can do.
    await page.goto("/en")
    const src = await page
      .locator('script[src^="/_next/static/"]')
      .first()
      .getAttribute("src")
    expect(src).toBeTruthy()

    const response = await request.get(src as string)
    expect(response.status()).toBe(200)
    expect(response.headers()["x-content-type-options"]).toBe("nosniff")
    expect(response.headers()["x-powered-by"]).toBeUndefined()
  })

  test("/api/images/* is sandboxed rather than taking the site policy", async ({
    request,
  }) => {
    // SVG is the reason this route needs its own policy. Fetched as an <img> it
    // cannot script, but opened directly it becomes a same-origin document,
    // where the site policy's 'unsafe-inline' would let a <script> inside the
    // file run with full origin privileges.
    const response = await request.get("/api/images/next.svg")
    expect(response.status()).toBe(200)
    expect(response.headers()["content-type"]).toBe("image/svg+xml")
    expect(response.headers()["x-content-type-options"]).toBe("nosniff")

    const csp = response.headers()["content-security-policy"]
    expect(csp).toContain("default-src 'none'")
    expect(csp).toContain("sandbox")
    expect(csp).not.toContain("'unsafe-inline'")
  })
})

/**
 * Violations are collected through the `securitypolicyviolation` DOM event
 * rather than by matching console text. Chromium, Firefox and WebKit word
 * their CSP messages differently, so a string filter passes vacuously on the
 * engines it does not know — a false green, which is the worst outcome for a
 * check like this.
 *
 * `addInitScript` registers the listener before the document's own inline
 * scripts parse. Without that the theme script's violation, the single most
 * likely one here, would be missed.
 */
const COLLECT_VIOLATIONS = `
  window.__cspViolations = []
  document.addEventListener("securitypolicyviolation", (event) => {
    window.__cspViolations.push(
      event.violatedDirective +
        " blocked " +
        (event.blockedURI || event.sourceFile || "inline"),
    )
  })
`

function readViolations(page: Page): Promise<string[]> {
  return page.evaluate(
    () => (window as unknown as { __cspViolations: string[] }).__cspViolations,
  )
}

test.describe("The policy does not break the page", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(COLLECT_VIOLATIONS)
  })

  for (const path of ["/en", "/ja", "/en/blog"]) {
    test(`${path} renders with no violation`, async ({ page }) => {
      await page.goto(path)
      // Scroll so scroll-progress writes its inline style attribute and the
      // lazily-mounted client components run.
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
      await expect(page.locator("footer")).toBeVisible()
      expect(await readViolations(page)).toEqual([])
    })
  }

  // components/theme-init-script.tsx is an inline script in <head>. If
  // script-src ever loses 'unsafe-inline' this is the first casualty, and the
  // symptom in production is a flash of the wrong theme rather than an error —
  // nothing else here would catch it.
  //
  // Each scheme gets its own describe so Playwright fixes it when the context
  // is created. Calling emulateMedia and navigating within one test is racy:
  // Firefox had the second navigation's inline script still reading the first
  // scheme from matchMedia.
  for (const { scheme, expectsDark } of [
    { expectsDark: true, scheme: "dark" },
    { expectsDark: false, scheme: "light" },
  ] as const) {
    test.describe(`with a ${scheme} colour scheme`, () => {
      test.use({ colorScheme: scheme })

      test("the theme script still runs, so there is no flash", async ({
        page,
      }) => {
        await page.goto("/en")
        const html = page.locator("html")
        if (expectsDark) {
          await expect(html).toHaveClass(/dark/)
        } else {
          await expect(html).not.toHaveClass(/dark/)
        }
        expect(await readViolations(page)).toEqual([])
      })
    })
  }

  test("an injected inline event handler is refused", async ({ page }) => {
    // The directive above is asserted as a string; this asserts the behaviour,
    // which is what actually matters. An `onclick=` attribute added after load
    // is the shape an HTML injection takes, and `script-src-attr 'none'` has to
    // stop it from running even though `script-src` allows inline script.
    await page.goto("/en")

    const fired = await page.evaluate(() => {
      const probe = document.createElement("button")
      probe.setAttribute("onclick", "window.__handlerRan = true")
      document.body.append(probe)
      probe.click()
      probe.remove()
      return (
        (window as unknown as { __handlerRan?: boolean }).__handlerRan === true
      )
    })
    expect(fired, "an inline onclick attribute executed").toBe(false)

    // The violation is the positive signal that the directive, rather than an
    // unrelated failure, is what stopped it. All three engines implement
    // `script-src-attr` (Chrome 75, Firefox 108, Safari 15.4), the same support
    // floor as the `style-src-attr` this config already relies on, so no engine
    // is excused here. `toContain` rather than an equality check because the
    // reported directive name is `script-src-attr` on some engines and the
    // effective `script-src` on others.
    const violations = await readViolations(page)
    expect(violations.join(" ")).toContain("script-src")
  })

  test("Server Actions still reach the origin", async ({ page, baseURL }) => {
    // The home page mounts ViewCountsProvider, which calls a Server Action from
    // an effect. The action POSTs to the current URL. What is asserted is the
    // round trip, not the data: a connect-src or form-action regression would
    // stop the request before it left the browser. The status is left alone so
    // this still passes with no database configured locally.
    const actionResponse = page.waitForResponse(
      (response) =>
        response.request().method() === "POST" &&
        response.url().startsWith(baseURL ?? "http://localhost:3000"),
      { timeout: 15_000 },
    )

    await page.goto("/en")
    await actionResponse
    expect(await readViolations(page)).toEqual([])
  })

  test("fonts, styles and images load rather than being blocked", async ({
    page,
  }) => {
    const blocked: string[] = []
    page.on("requestfailed", (request) => {
      const type = request.resourceType()
      if (type === "font" || type === "image" || type === "stylesheet") {
        blocked.push(`${type} ${request.url()}`)
      }
    })

    await page.goto("/en")
    await expect(page.locator("footer")).toBeVisible()

    // next/font self-hosts under /_next/static/media, so a font-src regression
    // surfaces as a failed request rather than a visual difference.
    expect(blocked).toEqual([])
    expect(await readViolations(page)).toEqual([])
  })
})
