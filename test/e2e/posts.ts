import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { parseFrontmatter } from "../../lib/content/frontmatter"
import { POSTS_PER_PAGE } from "../../lib/pagination"

type Locale = "en" | "ja"

/**
 * The posts the server under test serves, read from `content/posts` the way
 * the site reads them. The tests in this directory are about how the site
 * lists, filters and renders posts, not about which posts there are, so their
 * expected values come from here rather than from numbers written into the
 * assertions: publishing a post or revising one changes nothing in the tests.
 *
 * Read synchronously at module load, so a test file can use the values while
 * declaring its tests.
 */
function posts(locale: Locale) {
  const dir = join(process.cwd(), "content", "posts", locale)
  return readdirSync(dir)
    .filter((file) => file.endsWith(".mdx"))
    .map((file) => ({
      frontmatter: parseFrontmatter(readFileSync(join(dir, file), "utf-8"))
        .frontmatter,
      slug: file.replace(/\.mdx$/, ""),
    }))
}

/** How many post links the list page shows: the first page of the matching posts. */
export function listedPostCount(locale: Locale, tag?: string): number {
  const matching = posts(locale).filter(
    (post) => tag === undefined || post.frontmatter.tags.includes(tag),
  )
  return Math.min(matching.length, POSTS_PER_PAGE)
}

/**
 * The dates of one post as the page is expected to render them: the dotted
 * form that is shown, and the spoken form that is left for a screen reader.
 * The forms are written out here on purpose rather than imported from
 * `lib/i18n/format-date`, so that a change to the site's formatting still
 * fails a test instead of moving both sides at once.
 */
export function postDates(locale: Locale, slug: string) {
  const post = posts(locale).find((candidate) => candidate.slug === slug)
  if (post === undefined) {
    throw new Error(`No ${locale} post with slug ${slug}`)
  }
  const { date, updated } = post.frontmatter
  if (updated === undefined) {
    throw new Error(`The ${locale} post ${slug} has no revision date`)
  }
  const dotted = (iso: string) => iso.replaceAll("-", ".")
  return {
    dotted: dotted(date),
    spoken: new Intl.DateTimeFormat(locale, {
      dateStyle: "long",
      timeZone: "UTC",
    }).format(new Date(date)),
    updated: dotted(updated),
  }
}
