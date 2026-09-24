import { expect, type Page } from "@playwright/test"

/**
 * Waits for a post's body to be in `<main>`.
 *
 * The body sits behind a Suspense boundary, and the HTML carries it inside a
 * `<div hidden>` beside the skeleton that `<main>` shows first. React moves it
 * in with an inline script whose reveal it deliberately throttles, so it lands
 * after the `load` event that `page.goto` returns on, ~50ms later on a local
 * build. Until then `document.querySelector` finds the hidden copy: its text
 * is all there but it has no layout, so every rectangle is zeros and every
 * bounding box is null. A test that reads the DOM straight after `goto` either
 * fails on an empty `<main>` or passes on zeros without measuring anything.
 */
export async function revealed(page: Page): Promise<void> {
  // The skeleton has an `<article>` too; only the real one has a title.
  await expect(page.locator("main article h1")).toBeVisible()
}
