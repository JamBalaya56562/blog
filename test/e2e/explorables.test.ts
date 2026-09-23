import { expect, test } from "@playwright/test"

const POST = "/ja/blog/docker-build"

/**
 * The figure whose strip carries this title. Posts gain figures — the
 * Jujutsu one has four — so a position would quietly point somewhere else
 * the next time one is added.
 */
function figureNamed(page: import("@playwright/test").Page, title: string) {
  return page.locator(`figure.pp-explorable[aria-label="${title}"]`)
}

/**
 * The pane the reader is looking at. A stepped figure keeps every step in
 * the markup so its height cannot move, so a query that does not say which
 * step it means would answer for all of them at once.
 */
function shown(figure: ReturnType<typeof figureNamed>) {
  return figure.locator('.pp-explorable-pane[data-active="true"]')
}

/**
 * Waits until React owns the figure, not just until it is on screen.
 *
 * The markup is server-rendered, so a figure is visible — and typable into —
 * before hydration reaches it. A `fill` that lands in that window sets the
 * DOM value and nothing else: the first client render replaces it from the
 * component's own state, and the figure never moves. React tags the nodes it
 * has taken over, so that tag is what "ready" means here.
 */
async function ready(figure: ReturnType<typeof figureNamed>) {
  await expect(figure).toBeVisible()
  await figure.evaluate(
    (el) =>
      new Promise<void>((resolve) => {
        const owned = () =>
          Object.keys(el).some((key) => key.startsWith("__react"))
        const check = () => (owned() ? resolve() : requestAnimationFrame(check))
        check()
      }),
  )
}

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
    const figure = figureNamed(page, "Dockerfile")
    await ready(figure)
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
    const figure = figureNamed(page, "Dockerfile")
    await ready(figure)
    const first = figure.locator(".pp-explorable-row").first()

    await first.focus()
    await page.keyboard.press("Enter")
    await expect(first).toHaveAttribute("data-state", "changed")
    await expect(shown(figure).locator(".pp-explorable-status")).toContainText(
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
    const figure = figureNamed(page, "Dockerfile")
    await ready(figure)
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
  // and the release figure higher up the page has a panel of the same kind,
  // so the slice starts at this figure rather than at the first match.
  test("the served HTML carries the findings for the preset", async ({
    request,
  }) => {
    const html = await (await request.get(POST)).text()
    expect(html).toContain('value="Fix: Login Button."')
    const start = html.indexOf('aria-label="commitlint"')
    expect(start).toBeGreaterThan(-1)
    const panel = html.slice(start, html.indexOf("</figure>", start))
    expect(panel).toContain("[subject-full-stop]")
    expect(panel).toContain("found 4 problems, 0 warnings")
  })

  test("typing a conventional message clears the findings", async ({
    page,
  }) => {
    await page.goto(POST)
    const figure = figureNamed(page, "commitlint")
    await ready(figure)
    const field = figure.locator("input.pp-explorable-input")

    await field.fill("feat(blog): add a figure the reader can touch")
    await expect(
      shown(figure).locator(".pp-explorable-line").last(),
    ).toHaveText("found 0 problems, 0 warnings")
    await expect(
      shown(figure).locator(".pp-explorable-line[data-level=error]"),
    ).toHaveCount(0)

    await field.fill("Feat: Add a figure.")
    await expect(
      shown(figure).locator(".pp-explorable-line[data-level=error]"),
    ).toHaveCount(5)
    await expect(
      shown(figure).locator(".pp-explorable-line").last(),
    ).toHaveText("found 4 problems, 0 warnings")
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
    shown(figure).locator(`ol[aria-label="${column}"] .pp-explorable-graph-row`)

  function figureOn(page: import("@playwright/test").Page) {
    return figureNamed(page, "git / jj")
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
    await ready(figure)
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
    await ready(figure)

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
    await ready(figure)
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

  /**
   * Seven commands are readable because they are in rows by what they do,
   * and a button says which half of the picture it lands on before it is
   * read: the container, the volume, or the mount that is both.
   */
  test("the commands are in labelled rows, coloured by what they touch", async ({
    page,
  }) => {
    await page.goto(POST)
    const figure = figureNamed(page, "nginx:1.29-alpine")
    await ready(figure)

    await expect(figure.locator(".pp-explorable-group-head")).toHaveText([
      "起こす",
      "書く",
      "止める",
      "消す",
    ])
    await expect(
      figure.locator('.pp-explorable-cmd[data-target="volume"]'),
    ).toHaveText("volume rm site")
    await expect(
      figure.locator('.pp-explorable-cmd[data-target="mount"]'),
    ).toHaveText("run -d -v site")
  })

  /** The image under the container is one line, not a stack taller than it. */
  test("the image layers sit on one line under the container", async ({
    page,
  }) => {
    await page.goto(POST)
    const figure = figureNamed(page, "nginx:1.29-alpine")
    await ready(figure)

    const tops = await figure
      .locator(".pp-explorable-layer")
      .evaluateAll((layers) =>
        layers.map((layer) => Math.round(layer.getBoundingClientRect().top)),
      )
    expect(tops).toHaveLength(4)
    expect(new Set(tops).size).toBe(1)
  })

  /** The three states, with the one the container is at lit. */
  test("the track follows the container", async ({ page }) => {
    await page.goto(POST)
    const figure = figureNamed(page, "nginx:1.29-alpine")
    await ready(figure)
    const at = figure.locator('.pp-explorable-track li[data-at="true"]')

    await expect(at).toHaveText("Up")
    await press(figure, "stop")
    await expect(at).toHaveText("Exited (0)")
  })

  test("rm takes the writable layer and leaves the volume", async ({
    page,
  }) => {
    await page.goto(POST)
    // The second figure is the one with a volume mounted.
    const figure = figureNamed(page, "postgres:18-alpine")
    await ready(figure)
    const volume = figure.locator(".pp-explorable-volume")
    const layer = figure.locator(".pp-explorable-box")

    await expect(volume).toContainText("notes")

    await press(figure, "rm -f")
    await expect(layer).toHaveAttribute("data-on", "false")
    await expect(volume).toContainText("notes")
    await expect(volume).toHaveAttribute("data-on", "true")
  })

  // "使っているものは消せない": the button stays pressable so the refusal
  // can be read, which is the opposite of the other disabled commands.
  test("a volume in use refuses to be removed", async ({ page }) => {
    await page.goto(POST)
    const figure = figureNamed(page, "postgres:18-alpine")
    await ready(figure)

    const remove = figure.locator(".pp-explorable-cmd", {
      hasText: "volume rm",
    })
    await expect(remove).toBeEnabled()
    await remove.click()

    await expect(shown(figure).locator(".pp-explorable-status")).toContainText(
      "使っている",
    )
    // The refusal is printed as one rather than as a command that ran.
    await expect(shown(figure).locator(".pp-explorable-line")).toHaveAttribute(
      "data-level",
      "error",
    )
    await expect(figure.locator(".pp-explorable-volume")).toContainText("notes")
  })

  test("a write without a volume does not survive the container", async ({
    page,
  }) => {
    await page.goto(POST)
    const figure = figureNamed(page, "nginx:1.29-alpine")
    await ready(figure)
    const layer = figure.locator(".pp-explorable-box")

    await expect(layer).toContainText("index.html")
    await press(figure, "rm -f")
    await figure.locator(".pp-explorable-cmd", { hasText: /^run -d$/ }).click()
    await expect(layer).not.toContainText("index.html")
    // The line under the figure prints the whole of what the button ran.
    await expect(shown(figure).locator(".pp-explorable-line")).toHaveText(
      "docker run -d --name web -p 8080:80 nginx:1.29-alpine",
    )
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
    figureNamed(page, "jj squash README.md")

  // The article's own prose quotes both hashes a few lines above the figure,
  // so the assertions read the figure's markup rather than the page's.
  test("the served HTML carries every step, showing the first", async ({
    request,
  }) => {
    const html = await (await request.get(POST)).text()
    const start = html.indexOf('aria-label="jj squash README.md"')
    expect(start).toBeGreaterThan(-1)
    const figure = html.slice(start, html.indexOf("</figure>", start))

    expect(figure).toContain('class="pp-explorable-command">jj log<')
    // Both steps are served, which is what lets the figure take the room for
    // its tallest one before the reader touches it.
    expect(figure).toContain("bf873b9b")
    expect(figure).toContain("901a7c31")

    // The first step is the one showing and the second is beside it, held
    // in the layout and hidden.
    const panes = [...figure.matchAll(/data-active="(true|false)"/g)].map(
      (match) => match[1],
    )
    expect(panes.slice(0, 2)).toEqual(["true", "false"])
  })

  test("stepping forward marks the rewritten commit", async ({ page }) => {
    await page.goto(POST)
    const figure = squash(page)
    await ready(figure)
    const rows = shown(figure).locator(".pp-explorable-graph-row")

    await expect(shown(figure).locator(".pp-explorable-command")).toHaveText(
      "jj log",
    )
    await expect(rows.nth(1)).toHaveAttribute("data-mark", "same")

    await figure.locator(".pp-explorable-cmd", { hasText: "進む" }).click()

    await expect(shown(figure).locator(".pp-explorable-command")).toHaveText(
      "jj squash README.md",
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
    const figure = figureNamed(page, "jj git fetch → jj rebase -d main")
    await ready(figure)
    const graph = shown(figure).locator(".pp-explorable-graph")

    await expect(graph).toHaveAttribute("data-forked", "true")
    await figure.locator(".pp-explorable-cmd", { hasText: "進む" }).click()
    await expect(graph).toHaveAttribute("data-forked", "false")
  })

  test("the slider moves the step too", async ({ page }) => {
    await page.goto(POST)
    const figure = squash(page)
    await ready(figure)
    const range = figure.locator("input[type=range]")

    await range.focus()
    await page.keyboard.press("ArrowRight")
    await expect(range).toHaveValue("1")
    await expect(shown(figure).locator(".pp-explorable-command")).toHaveText(
      "jj squash README.md",
    )
  })
})

/**
 * The Sapling post uses the same figure for a tool with no change ID: the
 * hash is the identity there, so an amend rewrites it and the rows still
 * have to line up across the steps.
 */
test.describe("Stacked graph figure", () => {
  const POST = "/ja/blog/getting-started-with-sapling"

  test("an amend marks the commit and the one stacked on it", async ({
    page,
  }) => {
    await page.goto(POST)
    const figure = figureNamed(page, "sl amend")
    await ready(figure)
    const rows = shown(figure).locator(".pp-explorable-graph-row")

    await expect(rows.first()).toHaveAttribute("data-mark", "same")
    await figure.locator(".pp-explorable-cmd", { hasText: "進む" }).click()

    // Both the amended commit and the one restacked onto it take new hashes.
    await expect(rows.nth(0)).toHaveAttribute("data-mark", "rewritten")
    await expect(rows.nth(1)).toHaveAttribute("data-mark", "rewritten")
    // The two below it were not touched.
    await expect(rows.nth(2)).toHaveAttribute("data-mark", "same")
    await expect(rows.nth(3)).toHaveAttribute("data-mark", "same")
  })

  // The submit step rewrites nothing, so the figure marks nothing and drops
  // the legend rather than showing a swatch for a colour that is not there.
  test("a step that rewrites nothing shows no legend", async ({ page }) => {
    await page.goto(POST)
    const figure = figureNamed(page, "sl pr submit")
    await ready(figure)
    const range = figure.locator("input[type=range]")

    await range.fill("2")
    await expect(shown(figure).locator(".pp-explorable-command")).toHaveText(
      "sl pr submit",
    )
    await expect(
      shown(figure).locator(".pp-explorable-graph-row[data-mark=rewritten]"),
    ).toHaveCount(0)
    await expect(shown(figure).locator(".pp-explorable-legend")).toHaveCount(0)

    await range.fill("1")
    await expect(shown(figure).locator(".pp-explorable-legend")).toHaveCount(1)
  })
})

/**
 * The release figure works out the two things the article's transcripts
 * print — the next version and the grouped changelog — from the commit
 * messages alone.
 */
test.describe("Release figure", () => {
  const POST = "/ja/blog/getting-started-with-conventional-commits"

  test("the served HTML is the article's first transcript", async ({
    request,
  }) => {
    const html = await (await request.get(POST)).text()
    const start = html.indexOf('aria-label="git cliff"')
    expect(start).toBeGreaterThan(-1)
    const figure = html.slice(start, html.indexOf("</figure>", start))

    expect(figure).toContain("1.3.0")
    expect(figure).toContain("🚀 Features")
  })

  // The breaking change is out of the release, so its entry is not on the
  // panel the reader sees — it is in the one beside it that reserves the
  // room for the whole release.
  test("the changelog on screen leaves the breaking change out", async ({
    page,
  }) => {
    await page.goto(POST)
    const figure = figureNamed(page, "git cliff")
    await ready(figure)

    await expect(
      shown(figure).locator(
        ".pp-explorable-changelog-entry[data-breaking=true]",
      ),
    ).toHaveCount(0)
    await expect(
      figure.locator(".pp-explorable-changelog-entry[data-breaking=true]"),
    ).toHaveCount(1)
  })

  test("adding the breaking change makes it a major release", async ({
    page,
  }) => {
    await page.goto(POST)
    const figure = figureNamed(page, "git cliff")
    await ready(figure)
    const version = shown(figure).locator(".pp-explorable-version")

    await expect(version).toHaveText("1.2.3 → 1.3.0")

    await figure
      .locator(".pp-explorable-row", { hasText: "drop the v1 endpoints" })
      .click()

    await expect(version).toHaveText("1.2.3 → 2.0.0")
    await expect(
      shown(figure).locator(
        ".pp-explorable-changelog-entry[data-breaking=true]",
      ),
    ).toHaveCount(1)
  })
})

/**
 * Two of the mise sections come down to the order of a few lines, and the
 * figure is the same one in both: move a line and the answer moves.
 */
test.describe("Ordering figures", () => {
  const moveDown = (figure: ReturnType<typeof figureNamed>, position: number) =>
    figure
      .locator(".pp-explorable-row")
      .nth(position)
      .locator('[data-move="down"]')
      .click()

  test("swapping the env lines swaps the exported value", async ({ page }) => {
    await page.goto("/ja/blog/mise-environment-variables")
    const figure = figureNamed(page, "mise.toml の [env]")
    await ready(figure)
    const outcome = shown(figure).locator(".pp-explorable-outcome")

    await expect(outcome).toHaveText("from-dotenv")
    await moveDown(figure, 0)
    await expect(outcome).toHaveText("from-mise-toml")
  })

  test("moving the failing step down lets the rest run", async ({ page }) => {
    await page.goto("/ja/blog/mise-tasks")
    const figure = figureNamed(page, "run の配列")
    await ready(figure)
    const rows = figure.locator(".pp-explorable-row")

    await expect(rows.nth(2)).toHaveAttribute("data-line-state", "skipped")
    await moveDown(figure, 1)
    await expect(rows.nth(1)).toHaveAttribute("data-line-state", "ran")
    await expect(rows.nth(2)).toHaveAttribute("data-line-state", "failed")
  })

  /**
   * The controls sit in the row's third column whether or not the line has
   * a note under it. Left to flow they would land at the start of the next
   * line on the rows that have one, which is where they were.
   */
  test("the controls line up whatever the line has to say", async ({
    page,
  }) => {
    await page.goto("/ja/blog/mise-tasks")
    const figure = figureNamed(page, "run の配列")
    await ready(figure)

    const offsets = await figure.evaluate((el) =>
      [...el.querySelectorAll(".pp-explorable-row")].map((row) => ({
        note: row.querySelector(".pp-explorable-note") !== null,
        right: Math.round(
          row.getBoundingClientRect().right -
            (
              row.querySelector(".pp-explorable-moves") as Element
            ).getBoundingClientRect().right,
        ),
      })),
    )

    expect(offsets.some((row) => row.note)).toBe(true)
    expect(offsets.some((row) => !row.note)).toBe(true)
    expect(new Set(offsets.map((row) => row.right)).size).toBe(1)
  })

  // The row moves out from under the pointer, so the button that moved it
  // has to keep the focus rather than dropping it to the document.
  test("focus follows the line that moved", async ({ page }) => {
    await page.goto("/ja/blog/mise-tasks")
    const figure = figureNamed(page, "run の配列")
    await ready(figure)

    await moveDown(figure, 0)
    await expect(
      figure.locator(".pp-explorable-row").nth(1).locator('[data-move="down"]'),
    ).toBeFocused()
  })
})

/**
 * `docker build .` sends the directory to the engine, and `.dockerignore`
 * is what keeps it small. Switching a line off puts what it was keeping out
 * back on the wire — unless another line covers it, which is the thing the
 * repository's own file does twice over.
 */
test.describe("Build context figure", () => {
  test("switching both node_modules lines off sends them", async ({ page }) => {
    await page.goto(POST)
    const figure = figureNamed(page, "docker build .")
    await ready(figure)
    const dependencies = figure
      .locator(".pp-explorable-row", { hasText: "node_modules" })
      .first()
    const bare = figure.locator(".pp-explorable-cmd", {
      hasText: /^node_modules$/,
    })
    const globstar = figure.locator(".pp-explorable-cmd", {
      hasText: /^\*\*\/node_modules$/,
    })

    await expect(dependencies).toHaveAttribute("data-line-state", "skipped")

    // The globstar line covers the bare one, so one is not enough.
    await bare.click()
    await expect(dependencies).toHaveAttribute("data-line-state", "skipped")
    await expect(dependencies).toContainText("**/node_modules")

    await globstar.click()
    await expect(dependencies).toHaveAttribute("data-line-state", "ran")
  })

  /**
   * Every line the figure lists is a line the directory beside it has
   * something for. A line that matches no entry is a button that does
   * nothing when pressed, which is what the `.github` line was: the
   * article's own `.dockerignore` has it, the sample directory did not.
   */
  test("every line in the figure keeps something out", async ({ page }) => {
    await page.goto(POST)
    const figure = figureNamed(page, "docker build .")
    await ready(figure)

    const lines = await figure.locator(".pp-explorable-cmd").allTextContents()
    const reasons = await figure
      .locator(".pp-explorable-badge")
      .allTextContents()

    expect(lines.length).toBeGreaterThan(0)
    for (const line of lines) {
      // The badge names the line that excluded the entry, so a line with
      // no badge of its own excluded nothing. Matching on the start keeps
      // `node_modules` from being answered by `**/node_modules`.
      expect(reasons.some((reason) => reason.startsWith(`${line} `))).toBe(true)
    }
  })
})

/**
 * A figure that grows a row when a control is pressed pushes the article
 * under it down the page, and the reader loses the line they were on. These
 * figures take the room for their tallest state up front, so using them
 * moves nothing — every figure the site has.
 *
 * The phone projects run this too, which is where it matters most: a figure
 * that holds its height at 1440px can still grow two lines at 412px.
 */
test.describe("Figures that keep their height", () => {
  const STILL = [
    { post: "/ja/blog/docker-build", title: "docker build ." },
    { post: "/ja/blog/docker-build", title: "Dockerfile" },
    {
      post: "/ja/blog/getting-started-with-docker",
      title: "nginx:1.29-alpine",
    },
    {
      post: "/ja/blog/getting-started-with-docker",
      title: "postgres:18-alpine",
    },
    { post: "/ja/blog/getting-started-with-jujutsu", title: "git / jj" },
    {
      post: "/ja/blog/mise-environment-variables",
      title: "mise.toml の [env]",
    },
    { post: "/ja/blog/mise-tasks", title: "run の配列" },
    {
      post: "/ja/blog/getting-started-with-jujutsu",
      title: "jj squash README.md",
    },
    {
      post: "/ja/blog/getting-started-with-jujutsu",
      title: "jj edit tturtmot",
    },
    {
      post: "/ja/blog/getting-started-with-jujutsu",
      title: "jj git fetch → jj rebase -d main",
    },
    { post: "/ja/blog/getting-started-with-sapling", title: "sl amend" },
    { post: "/ja/blog/getting-started-with-sapling", title: "sl pr submit" },
    {
      post: "/ja/blog/getting-started-with-conventional-commits",
      title: "git cliff",
    },
    {
      post: "/ja/blog/getting-started-with-conventional-commits",
      title: "commitlint",
    },
  ] as const

  for (const { post, title } of STILL) {
    test(`${title} is the same height whatever is pressed`, async ({
      page,
    }) => {
      await page.goto(post)
      const figure = figureNamed(page, title)
      await ready(figure)
      const height = () =>
        figure.evaluate((el) => Math.round(el.getBoundingClientRect().height))
      const served = await height()
      expect(served).toBeGreaterThan(0)

      const controls = figure.locator(
        ".pp-explorable-cmd, .pp-explorable-row[aria-pressed], [data-move]",
      )
      for (let i = 0; i < (await controls.count()); i++) {
        const control = controls.nth(i)
        if (await control.isDisabled()) {
          continue
        }
        await control.click()
        expect(await height()).toBe(served)
      }

      // The stepped figures are driven by a slider as well as by buttons.
      const range = figure.locator("input[type=range]")
      if (await range.count()) {
        const last = Number(await range.first().getAttribute("max"))
        for (let step = 0; step <= last; step++) {
          await range.first().fill(String(step))
          expect(await height()).toBe(served)
        }
      }

      // The order the commands come in is a state of its own: a figure can
      // reach a taller arrangement by one route than by another. Pressing
      // them back to front covers the other way round.
      const reset = figure.locator(".pp-explorable-reset")
      if (await reset.isEnabled()) {
        await reset.click()
      }
      for (let i = (await controls.count()) - 1; i >= 0; i--) {
        const control = controls.nth(i)
        if (await control.isDisabled()) {
          continue
        }
        await control.click()
        expect(await height()).toBe(served)
      }
    })
  }

  /**
   * The route matters here and it was missed: pushing before the last
   * commits leaves origin/main on an old row while main moves to a new one,
   * and the column takes a line for each name instead of one line for both.
   */
  test("the bookmark figure holds its height whichever route is taken", async ({
    page,
  }) => {
    await page.goto("/ja/blog/getting-started-with-jujutsu")
    const figure = figureNamed(page, "git / jj")
    await ready(figure)
    const height = () =>
      figure.evaluate((el) => Math.round(el.getBoundingClientRect().height))
    const served = await height()
    // A route can reach a state where the next command has nothing to do;
    // the height still has to hold across the rest of it.
    const press = async (command: string) => {
      const button = figure.locator(".pp-explorable-cmd", { hasText: command })
      if (await button.isEnabled()) {
        await button.click()
      }
    }

    for (const route of [
      ["jj git push", "jj describe", "jj describe", "jj bookmark set"],
      ["jj describe", "jj git push", "jj describe", "jj bookmark set"],
      ["jj git push", "jj describe", "jj bookmark set", "jj describe"],
    ]) {
      const reset = figure.locator(".pp-explorable-reset")
      if (await reset.isEnabled()) {
        await reset.click()
      }
      for (const command of route) {
        await press(command)
        expect(await height()).toBe(served)
      }
    }
  })
})

/**
 * Nothing outside a figure moves now, so what moves inside it is free to
 * say something: the pane that arrives fades in over the room already taken
 * for it, and a line that is moved travels to where it landed.
 */
test.describe("Figures that move on purpose", () => {
  test("a line that is moved travels to its new place", async ({ page }) => {
    await page.goto("/ja/blog/mise-tasks")
    const figure = figureNamed(page, "run の配列")
    await ready(figure)
    const rows = figure.locator(".pp-explorable-row")
    const first = await rows.first().getAttribute("data-line")

    await rows.first().locator('[data-move="down"]').click()

    // The row is in its new place in the layout and on its way there on
    // screen, which is the whole of the animation.
    const moved = figure.locator(`.pp-explorable-row[data-line="${first}"]`)
    expect(
      await moved.evaluate((el) =>
        el.getAnimations().map((animation) => animation.playState),
      ),
    ).not.toHaveLength(0)
  })

  test("the pane that arrives fades in", async ({ page }) => {
    await page.goto("/ja/blog/getting-started-with-jujutsu")
    const figure = figureNamed(page, "jj squash README.md")
    await ready(figure)

    await figure.locator(".pp-explorable-cmd", { hasText: "進む" }).click()
    const fading = await shown(figure)
      .first()
      .evaluate((el) => window.getComputedStyle(el).transitionProperty)
    expect(fading).toContain("opacity")
  })
})

test.describe("Explorable figures — prefers-reduced-motion", () => {
  test.use({ reducedMotion: "reduce" })

  /** The new order arrives; the travel to it does not. */
  test("a line that is moved does not travel", async ({ page }) => {
    await page.goto("/ja/blog/mise-tasks")
    const figure = figureNamed(page, "run の配列")
    await ready(figure)
    const rows = figure.locator(".pp-explorable-row")
    const first = await rows.first().getAttribute("data-line")

    await rows.first().locator('[data-move="down"]').click()

    const moved = figure.locator(`.pp-explorable-row[data-line="${first}"]`)
    expect(await moved.evaluate((el) => el.getAnimations().length)).toBe(0)
    // The line did move; it is the second row now.
    expect(await rows.nth(1).getAttribute("data-line")).toBe(first)
  })

  /** A chip arrives with a nudge in its fade, and the nudge is motion. */
  test("a chip written into the layer does not slide in", async ({ page }) => {
    await page.goto("/ja/blog/getting-started-with-docker")
    const figure = figureNamed(page, "nginx:1.29-alpine")
    await ready(figure)

    const animation = await figure
      .locator(".pp-explorable-item")
      .first()
      .evaluate((el) => window.getComputedStyle(el).animationName)
    expect(animation).toBe("none")
  })

  // The strip's scan band is an animation and the bar's growth is a width
  // transition; a reader who asked for less motion gets neither.
  test("neither the strip nor the bar moves", async ({ page }) => {
    await page.goto(POST)
    const figure = figureNamed(page, "Dockerfile")
    await ready(figure)

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
