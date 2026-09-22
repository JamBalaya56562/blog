import { expect, test } from "@playwright/test"

const POST = "/ja/blog/docker-build"
const FIGURE = "figure.pp-explorable"

/**
 * The Dockerfile post carries a figure the reader can touch: the four steps of
 * a build, one of them changed, and the cache state of each. It is a client
 * component inside server-rendered MDX, so what matters is the same as for
 * the code tabs — the served markup already shows the state, and hydration
 * only adds the buttons' behaviour.
 */
test.describe("Explorable figures", () => {
  test("the served HTML carries the figure in its initial state", async ({
    request,
  }) => {
    const html = await (await request.get(POST)).text()
    expect(html).toContain('class="pp-explorable"')
    expect(html).toContain('data-state="cached"')
    expect(html).toContain('data-state="changed"')
    expect(html).toContain('data-state="rerun"')
    expect(html).toContain("CACHED")
  })

  test("pressing a step changes the cache below it, reset restores it", async ({
    page,
  }) => {
    await page.goto(POST)
    const figure = page.locator(FIGURE).first()
    await figure.scrollIntoViewIfNeeded()
    const rows = figure.locator(".pp-explorable-row")
    const reset = figure.locator(".pp-explorable-reset")

    await expect(rows).toHaveCount(4)
    await expect(rows.nth(1)).toHaveAttribute("data-state", "cached")
    await expect(reset).toBeDisabled()

    await rows.nth(1).click()
    await expect(rows.nth(1)).toHaveAttribute("data-state", "changed")
    await expect(rows.nth(1)).toHaveAttribute("aria-pressed", "true")
    await expect(rows.nth(2)).toHaveAttribute("data-state", "rerun")
    await expect(reset).toBeEnabled()

    await reset.click()
    await expect(rows.nth(1)).toHaveAttribute("data-state", "cached")
    await expect(rows.nth(2)).toHaveAttribute("data-state", "changed")
    await expect(reset).toBeDisabled()
    // Focus lands on the figure, not on the document, once the button under
    // the pointer disables itself.
    await expect(figure).toBeFocused()
  })

  test("a step can be pressed from the keyboard", async ({ page }) => {
    await page.goto(POST)
    const figure = page.locator(FIGURE).first()
    await figure.scrollIntoViewIfNeeded()
    const first = figure.locator(".pp-explorable-row").first()

    await first.focus()
    await page.keyboard.press("Enter")
    await expect(first).toHaveAttribute("data-state", "changed")
    await expect(figure.locator(".pp-explorable-status")).toContainText(
      "COPY pnpm-lock.yaml",
    )
  })

  // The article column is 288px wide on the narrowest phone project, and the
  // commands are unbroken strings; the figure must wrap them rather than push
  // the page sideways.
  test("fits the article column without horizontal overflow", async ({
    page,
  }) => {
    await page.goto(POST)
    const figure = page.locator(FIGURE).first()
    await figure.scrollIntoViewIfNeeded()
    const overflow = await figure.evaluate((el) => ({
      clientWidth: el.clientWidth,
      scrollWidth: el.scrollWidth,
    }))
    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth)
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true)
  })
})

/**
 * The Conventional Commits post checks a commit message as the reader types
 * it. The served markup already prints the findings for the preset message;
 * typing replaces them.
 */
test.describe("Commit message figure", () => {
  const POST = "/ja/blog/getting-started-with-conventional-commits"

  // The article's own transcript prints the same findings a little above,
  // so the assertions look only at the figure's terminal panel, which the
  // transcript does not have.
  test("the served HTML carries the findings for the preset", async ({
    request,
  }) => {
    const html = await (await request.get(POST)).text()
    expect(html).toContain('value="Fix: Login Button."')
    const term = html.indexOf('class="pp-explorable-term"')
    expect(term).toBeGreaterThan(-1)
    const panel = html.slice(term, html.indexOf("</figure>", term))
    expect(panel).toContain("[subject-full-stop]")
    expect(panel).toContain("found 4 problems, 0 warnings")
  })

  test("typing a conventional message clears the findings", async ({
    page,
  }) => {
    await page.goto(POST)
    const figure = page.locator(FIGURE).first()
    await figure.scrollIntoViewIfNeeded()
    const field = figure.locator("input.pp-explorable-input")

    await field.fill("feat(blog): add a figure the reader can touch")
    await expect(figure.locator(".pp-explorable-line").last()).toHaveText(
      "found 0 problems, 0 warnings",
    )
    await expect(
      figure.locator(".pp-explorable-line[data-level=error]"),
    ).toHaveCount(0)

    await field.fill("Feat: Add a figure.")
    await expect(
      figure.locator(".pp-explorable-line[data-level=error]"),
    ).toHaveCount(5)
    await expect(figure.locator(".pp-explorable-line").last()).toHaveText(
      "found 4 problems, 0 warnings",
    )
  })
})

test.describe("Explorable figures — prefers-reduced-motion", () => {
  test.use({ reducedMotion: "reduce" })

  // The strip's scan band is an animation and the bar's growth is a width
  // transition; a reader who asked for less motion gets neither.
  test("neither the strip nor the bar moves", async ({ page }) => {
    await page.goto(POST)
    const figure = page.locator(FIGURE).first()
    await figure.scrollIntoViewIfNeeded()

    const motion = await figure.evaluate((el) => {
      const head = el.querySelector(".pp-explorable-head") as Element
      const bar = el.querySelector(".pp-explorable-bar") as Element
      return {
        barTransition: getComputedStyle(bar, "::before").transitionProperty,
        headAnimation: getComputedStyle(head, "::after").animationName,
      }
    })
    expect(motion.headAnimation).toBe("none")
    expect(motion.barTransition).not.toContain("width")
  })
})
