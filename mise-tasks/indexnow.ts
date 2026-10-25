#!/usr/bin/env bun
//MISE description="Submit sitemap URLs changed since a saved copy to IndexNow: mise run indexnow <before.xml> [--dry-run]"
/**
 * Compares the live sitemap with the copy saved before a deploy and submits
 * the new and changed URLs to IndexNow, which shares them with every
 * participating search engine. The deploy workflow saves the "before" copy
 * and runs this once the new function serves.
 *
 * Both fetches carry a query string nobody has asked for yet. CloudFront keys
 * its cache on the whole query string, so that reaches the function itself
 * rather than a copy cached before the deploy.
 */
import {
  changedUrls,
  INDEXNOW_ENDPOINT,
  isCompleteSitemap,
  submission,
} from "@/lib/indexnow"
import { SITE_URL } from "@/lib/site"

const args = process.argv.slice(2)
const dryRun = args.includes("--dry-run")
const beforePath = args.find((arg) => arg !== "--dry-run")
if (!beforePath) {
  console.error("usage: mise run indexnow <before.xml> [--dry-run]")
  process.exit(1)
}

const before = await Bun.file(beforePath).text()
if (!isCompleteSitemap(before)) {
  console.error(
    `${beforePath} is not a complete sitemap; submitting nothing rather than every URL.`,
  )
  process.exit(1)
}
const response = await fetch(
  new URL(`/sitemap.xml?fresh=${Date.now()}`, SITE_URL),
)
if (!response.ok) {
  console.error(`Fetching the sitemap failed: ${response.status}`)
  process.exit(1)
}
const urls = changedUrls(before, await response.text())

if (urls.length === 0) {
  console.log("No sitemap URL changed; nothing to submit.")
  process.exit(0)
}
console.log(urls.join("\n"))
if (dryRun) {
  process.exit(0)
}

const result = await fetch(INDEXNOW_ENDPOINT, {
  body: JSON.stringify(submission(urls)),
  headers: { "Content-Type": "application/json; charset=utf-8" },
  method: "POST",
})
console.log(`IndexNow answered ${result.status} for ${urls.length} URL(s).`)
if (!result.ok) {
  console.error(await result.text())
  process.exit(1)
}
