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

/**
 * The Jujutsu post runs the same three commands against Git and against jj
 * side by side. The claim the section makes is a difference between the two
 * columns, so the assertions are about both at once.
 */
test.describe("Bookmark figure", () => {
  const POST = "/ja/blog/getting-started-with-jujutsu"
  const rows = (figure: ReturnType<typeof figureOn>, column: string) =>
    figure.locator(`ol[aria-label="${column}"] .pp-explorable-graph-row`)

  function figureOn(page: import("@playwright/test").Page) {
    return page.locator(FIGURE).first()
  }

  test("the served HTML carries both histories", async ({ request }) => {
    const html = await (await request.get(POST)).text()
    expect(html).toContain('aria-label="Git"')
    expect(html).toContain('aria-label="jj"')
    expect(html).toContain('data-kind="at"')
    expect(html).toContain('data-ref="bookmark"')
  })

  test("a commit carries Git's branch and leaves jj's bookmark", async ({
    page,
  }) => {
    await page.goto(POST)
    const figure = figureOn(page)
    await figure.scrollIntoViewIfNeeded()
    await expect(rows(figure, "Git")).toHaveCount(1)

    await figure
      .locator(".pp-explorable-cmd", { hasText: "git commit" })
      .click()

    // Git: the branch is on the new tip, beside HEAD.
    await expect(rows(figure, "Git").first()).toContainText("main")
    // jj: the working copy is on top, and the bookmark is two rows down,
    // still on the commit it was put on.
    await expect(rows(figure, "jj")).toHaveCount(3)
    await expect(rows(figure, "jj").nth(1)).not.toContainText("main")
    await expect(rows(figure, "jj").nth(2)).toContainText("main")
  })

  test("pushing marks what the remote holds", async ({ page }) => {
    await page.goto(POST)
    const figure = figureOn(page)
    await figure.scrollIntoViewIfNeeded()

    await figure
      .locator(".pp-explorable-cmd", { hasText: "git commit" })
      .click()
    await figure
      .locator(".pp-explorable-cmd", { hasText: "jj bookmark set" })
      .click()
    await figure
      .locator(".pp-explorable-cmd", { hasText: "jj git push" })
      .click()

    await expect(
      rows(figure, "jj").nth(1).locator(".pp-explorable-glyph"),
    ).toHaveAttribute("data-kind", "immutable")
    // The working copy is still the reader's to rewrite.
    await expect(
      rows(figure, "jj").first().locator(".pp-explorable-glyph"),
    ).toHaveAttribute("data-kind", "at")
  })

  test("both columns fit the phone's article width", async ({ page }) => {
    await page.goto(POST)
    const figure = figureOn(page)
    await figure.scrollIntoViewIfNeeded()
    const fits = await figure.evaluate((el) => el.scrollWidth <= el.clientWidth)
    expect(fits).toBe(true)
  })
})

/**
 * The Docker introduction carries two instances of the same figure: one
 * without a volume, where a write dies with the container, and one with it,
 * where the write outlives every container.
 */
test.describe("Container figure", () => {
  const POST = "/ja/blog/getting-started-with-docker"
  const press = (
    figure: ReturnType<import("@playwright/test").Page["locator"]>,
    text: string,
  ) => figure.locator(".pp-explorable-cmd", { hasText: text }).click()

  test("the served HTML carries both instances", async ({ request }) => {
    const html = await (await request.get(POST)).text()
    expect(html).toContain("pp-explorable-volume")
    expect(html).toContain("pp-explorable-layer")
    expect(html).toContain("index.html")
    expect(html).toContain("pgdata")
  })

  test("rm takes the writable layer and leaves the volume", async ({
    page,
  }) => {
    await page.goto(POST)
    // The second figure is the one with a volume mounted.
    const figure = page.locator(FIGURE).nth(1)
    await figure.scrollIntoViewIfNeeded()
    const volume = figure.locator(".pp-explorable-volume")
    const layer = figure.locator(".pp-explorable-box")

    await expect(volume).toContainText("notes")

    await press(figure, "docker rm -f db")
    await expect(layer).toHaveAttribute("data-on", "false")
    await expect(volume).toContainText("notes")
    await expect(volume).toHaveAttribute("data-on", "true")
  })

  // "使っているものは消せない": the button stays pressable so the refusal
  // can be read, which is the opposite of the other disabled commands.
  test("a volume in use refuses to be removed", async ({ page }) => {
    await page.goto(POST)
    const figure = page.locator(FIGURE).nth(1)
    await figure.scrollIntoViewIfNeeded()

    const remove = figure.locator(".pp-explorable-cmd", {
      hasText: "docker volume rm",
    })
    await expect(remove).toBeEnabled()
    await remove.click()

    await expect(figure.locator(".pp-explorable-status")).toContainText(
      "使っている",
    )
    await expect(figure.locator(".pp-explorable-volume")).toContainText("notes")
  })

  test("a write without a volume does not survive the container", async ({
    page,
  }) => {
    await page.goto(POST)
    const figure = page.locator(FIGURE).first()
    await figure.scrollIntoViewIfNeeded()
    const layer = figure.locator(".pp-explorable-box")

    await expect(layer).toContainText("index.html")
    await press(figure, "docker rm -f web")
    await press(figure, "docker run -d --name web")
    await expect(layer).not.toContainText("index.html")
  })
})

/**
 * The Jujutsu post steps through three of its own transcripts. What the
 * figure adds over the pictures it replaces is the mark: the row whose
 * commit ID moved while its change ID stayed.
 */
test.describe("Stepped graph figure", () => {
  const POST = "/ja/blog/getting-started-with-jujutsu"
  const squash = (page: import("@playwright/test").Page) =>
    page.locator(FIGURE).first()

  test("the served HTML is the first step of the first figure", async ({
    request,
  }) => {
    const html = await (await request.get(POST)).text()
    expect(html).toContain("pp-explorable-command")
    expect(html).toContain("bf873b9b")
    // The second step's hash is not in the markup until the reader asks.
    expect(html).not.toContain("901a7c31")
  })

  test("stepping forward marks the rewritten commit", async ({ page }) => {
    await page.goto(POST)
    const figure = squash(page)
    await figure.scrollIntoViewIfNeeded()
    const rows = figure.locator(".pp-explorable-graph-row")

    await expect(figure.locator(".pp-explorable-command")).toHaveText(
      "❯ jj log",
    )
    await expect(rows.nth(1)).toHaveAttribute("data-mark", "same")

    await figure.locator(".pp-explorable-cmd", { hasText: "進む" }).click()

    await expect(figure.locator(".pp-explorable-command")).toHaveText(
      "❯ jj squash README.md",
    )
    await expect(rows.nth(1)).toHaveAttribute("data-mark", "rewritten")
    await expect(rows.nth(1)).toContainText("901a7c31")
    await expect(
      figure.locator(".pp-explorable-cmd", { hasText: "進む" }),
    ).toBeDisabled()
  })

  // The fetch/rebase figure is the only one with a fork, and the rebase is
  // what closes it.
  test("the fork closes when the change is rebased", async ({ page }) => {
    await page.goto(POST)
    const figure = page.locator(FIGURE).last()
    await figure.scrollIntoViewIfNeeded()
    const graph = figure.locator(".pp-explorable-graph")

    await expect(graph).toHaveAttribute("data-forked", "true")
    await figure.locator(".pp-explorable-cmd", { hasText: "進む" }).click()
    await expect(graph).toHaveAttribute("data-forked", "false")
  })

  test("the slider moves the step too", async ({ page }) => {
    await page.goto(POST)
    const figure = squash(page)
    await figure.scrollIntoViewIfNeeded()
    const range = figure.locator("input[type=range]")

    await range.focus()
    await page.keyboard.press("ArrowRight")
    await expect(range).toHaveValue("1")
    await expect(figure.locator(".pp-explorable-command")).toHaveText(
      "❯ jj squash README.md",
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
