import { faviconSource, isHostname } from "@/lib/favicon"

// A favicon changes about never, and CloudFront sits in front of this route,
// so the upstream service is asked once per host and the copy is served from
// the edge for a day and stale for a month after that.
const CACHE_CONTROL = "public, max-age=86400, stale-while-revalidate=2592000"

// The whole function has ten seconds; a slow icon service must not spend them.
const FETCH_TIMEOUT_MS = 5000

/**
 * The favicon of an external host, fetched on the server so that the reader's
 * browser talks to this site only. The page's `img-src 'self'` stays as it is
 * and no visit is reported to a third party per link on the page.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ host: string }> },
): Promise<Response> {
  const { host } = await params

  if (!isHostname(host)) {
    return new Response("Bad Request", { status: 400 })
  }

  try {
    const res = await fetch(faviconSource(host), {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    })
    if (!res.ok) {
      return new Response("Not Found", { status: 404 })
    }
    return new Response(res.body, {
      headers: {
        "Cache-Control": CACHE_CONTROL,
        "Content-Type": res.headers.get("Content-Type") ?? "image/png",
      },
    })
  } catch (e) {
    console.error("Favicon fetch failed:", e)
    return new Response("Bad Gateway", { status: 502 })
  }
}
