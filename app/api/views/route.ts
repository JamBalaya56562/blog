import { getViewCounts, incrementViewCount } from "@/lib/db/queries"
import { isReader } from "@/lib/views/reader"

/**
 * View counts, read and recorded from the browser.
 *
 * These were Server Actions, which post to the URL of the page they are called
 * from. That tied them to the page's cache entry: Next.js answers an action on
 * a stale prerendered page by also revalidating the page in the background,
 * the revalidation runs the action handling a second time against the request
 * body the real action already consumed, and its `JSON.parse("")` failure set
 * the shared response to 500 before the real result had flushed. On Lambda
 * every instance starts from the build's entries, so in production that was
 * every read. Action IDs also change with every build, so a tab left open
 * across a deploy got "Server action not found". Neither applies to a route of
 * its own. The counter never used what actions add — it is called from an
 * effect, not a form, and revalidates nothing.
 */

// Slugs are MDX file names: lowercase words joined by single hyphens.
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const MAX_SLUG_LENGTH = 100
// A page asks for its own post and a few related ones; the home page for the
// bento grid. Anything near this is not the site asking.
const MAX_SLUGS = 50

// Counts move with every reader, and a CDN has no business holding one.
const NO_STORE = { "Cache-Control": "no-store" }

function isSlug(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length <= MAX_SLUG_LENGTH &&
    SLUG.test(value)
  )
}

function badRequest(reason: string): Response {
  return Response.json({ error: reason }, { headers: NO_STORE, status: 400 })
}

/** `GET /api/views?slug=a&slug=b` → `{ "a": 3, "b": 1 }`, uncounted slugs omitted. */
export async function GET(request: Request): Promise<Response> {
  const slugs = new URL(request.url).searchParams.getAll("slug")

  if (slugs.length > MAX_SLUGS) {
    return badRequest(`at most ${MAX_SLUGS} slugs`)
  }
  if (!slugs.every(isSlug)) {
    return badRequest("invalid slug")
  }

  const counts = await getViewCounts(slugs)
  return Response.json(Object.fromEntries(counts), { headers: NO_STORE })
}

/**
 * `POST /api/views` with `{ "slug": "a" }` → `{ "count": 4 }`.
 *
 * `count` is null when nothing was recorded: a crawler, no database, or a
 * failed write. That is still a 200 — the request was fine, and the counter
 * falls back to another figure either way.
 */
export async function POST(request: Request): Promise<Response> {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return badRequest("body must be JSON")
  }

  const slug = (body as { slug?: unknown } | null)?.slug
  if (!isSlug(slug)) {
    return badRequest("invalid slug")
  }

  const count = isReader(request.headers.get("user-agent"))
    ? await incrementViewCount(slug)
    : null
  return Response.json({ count }, { headers: NO_STORE })
}
