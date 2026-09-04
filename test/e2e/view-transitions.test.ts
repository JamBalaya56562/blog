import { expect, test } from "@playwright/test"

/**
 * The directional slide has three parts that have to line up: a `<Link>`
 * carrying `transitionTypes`, a `<PageTransition>` mapping that type onto a
 * `view-transition-class`, and the `::view-transition-old(.nav-forward)`
 * family in `app/globals.css`. All three shipped separately at some point
 * with nothing joining them, so these tests assert the join rather than the
 * animation: the types React hands to `document.startViewTransition`, and
 * the class it writes onto the page element while the transition runs.
 *
 * Reading the pseudo-elements is not possible from script, and diffing
 * screenshots of a 300ms animation is a flake generator — hence this seam.
 */

declare global {
  interface Window {
    __viewTransitionTypes: string[]
    __viewTransitionClasses: string[]
    __viewTransitionAnimations: {
      name: string
      pseudo: string
      duration: number
    }[]
  }
}

/** Records the transition types and classes React uses for each navigation. */
async function recordTransitions(page: import("@playwright/test").Page) {
  await page.addInitScript(() => {
    window.__viewTransitionTypes = []
    window.__viewTransitionClasses = []
    window.__viewTransitionAnimations = []
    const start = document.startViewTransition?.bind(document)
    if (!start) {
      return
    }
    document.startViewTransition = ((arg: unknown) => {
      if (arg && typeof arg === "object" && "types" in arg) {
        const options = arg as {
          types?: string[]
          update?: () => unknown
        }
        window.__viewTransitionTypes.push(...(options.types ?? []))
        const update = options.update
        if (update) {
          options.update = async () => {
            const result = await update()
            // React writes `viewTransitionClass` during the mutation phase
            // and clears it once the transition settles, so this callback is
            // the only window in which it is observable.
            for (const el of document.querySelectorAll<HTMLElement>("*")) {
              if (el.style.viewTransitionClass) {
                window.__viewTransitionClasses.push(
                  el.style.viewTransitionClass,
                )
              }
            }
            return result
          }
        }
      }
      const transition = start(arg as never)
      transition.ready
        .then(() => {
          for (const animation of document.getAnimations()) {
            const effect = animation.effect as KeyframeEffect | null
            const pseudo = effect?.pseudoElement
            if (!pseudo?.startsWith("::view-transition")) {
              continue
            }
            window.__viewTransitionAnimations.push({
              duration: Number(effect?.getComputedTiming().duration ?? 0),
              name:
                (animation as { animationName?: string }).animationName ?? "",
              pseudo,
            })
          }
        })
        .catch(() => {})
      return transition
    }) as typeof document.startViewTransition
  })
}

/**
 * A link clicked before hydration performs a full document navigation, which
 * starts no view transition and resets the recorder. React stamps
 * `__reactProps$…` onto a host node once it has hydrated it, so waiting for
 * that on the exact link under test is a precise readiness check — unlike
 * `networkidle`, which times out on a dev server still compiling routes, or
 * `window.next.router`, which appears before hydration finishes.
 */
async function clickHydrated(
  page: import("@playwright/test").Page,
  selector: string,
) {
  await page.locator(selector).first().waitFor()
  await page.waitForFunction((sel) => {
    const el = document.querySelector(sel)
    return (
      !!el && Object.keys(el).some((key) => key.startsWith("__reactProps$"))
    )
  }, selector)
  await page.locator(selector).first().click()
}

test.describe("Directional view transitions", () => {
  // Transition types and `view-transition-class` are Chromium 125+. Elsewhere
  // the app navigates normally, it just does not animate.
  test.skip(
    ({ browserName }) => browserName !== "chromium",
    "view-transition-class is not supported in this browser",
  )

  test.beforeEach(async ({ page }) => {
    await recordTransitions(page)
  })

  test("opening a post from the list navigates forward", async ({ page }) => {
    await page.goto("/en/blog")
    const supported = await page.evaluate(
      () =>
        typeof document.startViewTransition === "function" &&
        CSS.supports("view-transition-class", "nav-forward"),
    )
    test.skip(!supported, "no view-transition-class support")

    await Promise.all([
      page.waitForURL(/\/en\/blog\/.+/),
      clickHydrated(page, "a[href^='/en/blog/']"),
    ])

    await expect
      .poll(() => page.evaluate(() => window.__viewTransitionTypes))
      .toContain("nav-forward")
    // Polled, not read once: the types are pushed synchronously when the
    // transition starts, while the class is only observable later, inside
    // React's update callback.
    await expect
      .poll(() => page.evaluate(() => window.__viewTransitionClasses))
      .toContain("nav-forward")
  })

  test("the header logo navigates back", async ({ page }) => {
    await page.goto("/en/blog")
    const supported = await page.evaluate(
      () => typeof document.startViewTransition === "function",
    )
    test.skip(!supported, "no view transition support")

    await Promise.all([
      page.waitForURL(/\/en$/),
      clickHydrated(page, "header a[href='/en']"),
    ])

    await expect
      .poll(() => page.evaluate(() => window.__viewTransitionTypes))
      .toContain("nav-back")
  })

  test("untyped navigation carries no direction", async ({ page }) => {
    // Header and footer navigation is chrome rendered at every depth, so it
    // is deliberately untyped — a "forward" slide would point the wrong way
    // whenever the reader clicks Blog from a post. The footer link is the
    // one that exists at every width; the header's is inside the mobile
    // menu below `md`.
    await page.goto("/en")
    const supported = await page.evaluate(
      () => typeof document.startViewTransition === "function",
    )
    test.skip(!supported, "no view transition support")

    await Promise.all([
      page.waitForURL(/\/en\/blog$/),
      clickHydrated(page, "footer a[href='/en/blog']"),
    ])

    expect(await page.evaluate(() => window.__viewTransitionTypes)).toEqual([])
  })
})

test.describe("Directional view transitions — the slide itself", () => {
  test.skip(
    ({ browserName }) => browserName !== "chromium",
    "view-transition-class is not supported in this browser",
  )

  test.beforeEach(async ({ page }) => {
    await recordTransitions(page)
  })

  async function slideAnimations(page: import("@playwright/test").Page) {
    await expect
      .poll(() =>
        page.evaluate(() =>
          window.__viewTransitionAnimations.filter((a) =>
            a.name.startsWith("slide-"),
          ),
        ),
      )
      .not.toEqual([])
    return page.evaluate(() =>
      window.__viewTransitionAnimations.filter((a) =>
        a.name.startsWith("slide-"),
      ),
    )
  }

  async function openFirstPost(page: import("@playwright/test").Page) {
    await page.goto("/en/blog")
    test.skip(
      !(await page.evaluate(
        () => typeof document.startViewTransition === "function",
      )),
      "no view transition support",
    )
    await Promise.all([
      page.waitForURL(/\/en\/blog\/.+/),
      clickHydrated(page, "a[href^='/en/blog/']"),
    ])
  }

  test("the outgoing page slides left and the incoming page in from the right", async ({
    page,
  }) => {
    await openFirstPost(page)
    const slides = await slideAnimations(page)

    // These keyframes are what the `::view-transition-old(.nav-forward)`
    // family in globals.css applies. Seeing them run is the proof that the
    // class reached the pseudo-elements.
    expect(slides.map((a) => a.name)).toContain("slide-to-left")
    expect(slides.map((a) => a.name)).toContain("slide-from-right")
    expect(slides.every((a) => a.duration > 100)).toBe(true)
  })

  test("reduced motion collapses the slide", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" })
    await openFirstPost(page)
    const slides = await slideAnimations(page)

    // The reduced-motion cap has to carry `!important`: these rules select on
    // a class, so they outrank the `(*)` form and sit later in the file.
    expect(slides.every((a) => a.duration <= 1)).toBe(true)
  })
})
