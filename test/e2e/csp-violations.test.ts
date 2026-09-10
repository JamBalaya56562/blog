import { expect, test } from "@playwright/test"

const PATHS = [
  "/en",
  "/ja",
  "/en/blog",
  "/en/blog/getting-started-with-mise",
  "/ja/blog/getting-started-with-mise",
  "/en/portfolio",
  "/en/privacy-policy",
  "/en/nope",
]

/**
 * `style-src` dropped its 'unsafe-inline' once the stylesheet stopped being
 * inlined into every document. What makes that safe is an absence — no route
 * emits a `<style>`, and nothing in the bundle creates one at runtime — and an
 * absence is what regresses quietly: a component that adds an inline style
 * still renders in development, where the directive keeps 'unsafe-inline' for
 * the Next overlay, and loses its styling only in production.
 *
 * The browser is the only thing that can answer this, so the assertion is the
 * browser's own report rather than a reading of the markup. It covers every
 * directive, not just this one.
 */
test.describe("Content Security Policy", () => {
  for (const path of PATHS) {
    test(`${path} renders without tripping the policy`, async ({ page }) => {
      await page.addInitScript(() => {
        const violations: string[] = []
        Object.defineProperty(window, "__cspViolations", {
          value: violations,
        })
        document.addEventListener("securitypolicyviolation", (event) => {
          violations.push(
            `${event.effectiveDirective} blocked ${event.blockedURI || "inline"}`,
          )
        })
      })

      await page.goto(path)
      await page.waitForLoadState("domcontentloaded")

      const violations = await page.evaluate(
        () =>
          (window as unknown as { __cspViolations: string[] }).__cspViolations,
      )
      expect(violations).toEqual([])
    })
  }

  // Scrolling is the interaction that touches styling after hydration:
  // scroll-progress and the cursor ring both write style attributes on every
  // frame. It is also the one gesture that works the same on every project,
  // where the theme toggle sits inside a collapsed menu on the mobile ones.
  test("scrolling a post trips nothing either", async ({ page }) => {
    await page.addInitScript(() => {
      const violations: string[] = []
      Object.defineProperty(window, "__cspViolations", { value: violations })
      document.addEventListener("securitypolicyviolation", (event) => {
        violations.push(
          `${event.effectiveDirective} blocked ${event.blockedURI || "inline"}`,
        )
      })
    })

    await page.goto("/en/blog/getting-started-with-mise")
    // `mouse.wheel` is unsupported in mobile WebKit; scrolling the window
    // drives the same listeners on every project.
    await page.evaluate(() => window.scrollTo(0, 2000))
    await page.waitForTimeout(300)

    const violations = await page.evaluate(
      () =>
        (window as unknown as { __cspViolations: string[] }).__cspViolations,
    )
    expect(violations).toEqual([])
  })
})
