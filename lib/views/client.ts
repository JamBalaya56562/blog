const ENDPOINT = "/api/views"

/**
 * The SHA-256 of a request body, as lowercase hex, for `x-amz-content-sha256`.
 *
 * CloudFront reaches the function through origin access control, which signs
 * each request with SigV4, and a SigV4 signature covers the body's hash.
 * CloudFront streams a body to the origin rather than reading it first, so for
 * a POST it cannot work that hash out itself: the sender has to supply it, and
 * a function URL that checks signatures refuses a POST without one.
 *
 * `crypto.subtle` exists only in a secure context. A page served over plain
 * HTTP from something other than localhost — a dev server opened by LAN
 * address — has none, and no CloudFront in front of it either, so the header
 * is left off there rather than failing the request.
 */
async function bodyHash(body: string): Promise<string | undefined> {
  if (!globalThis.crypto?.subtle) {
    return undefined
  }
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(body),
  )
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("")
}

/**
 * Records one view and returns the post's new total, or null when nothing was
 * recorded — a crawler, no database, or a request that failed. The counter
 * treats all of those the same way, so none of them throws.
 */
export async function recordView(slug: string): Promise<number | null> {
  try {
    const body = JSON.stringify({ slug })
    const hash = await bodyHash(body)
    const res = await fetch(ENDPOINT, {
      body,
      headers: {
        "Content-Type": "application/json",
        ...(hash === undefined ? {} : { "x-amz-content-sha256": hash }),
      },
      method: "POST",
    })
    if (!res.ok) {
      return null
    }
    const { count } = (await res.json()) as { count: unknown }
    return typeof count === "number" ? count : null
  } catch {
    return null
  }
}

/**
 * The recorded count of each slug; a slug nobody has viewed is absent. Rejects
 * when the request fails, so a caller can tell "no counts" from "no answer".
 */
export async function fetchViewCounts(
  slugs: string[],
): Promise<Record<string, number>> {
  if (slugs.length === 0) {
    return {}
  }
  const query = new URLSearchParams(slugs.map((slug) => ["slug", slug]))
  const res = await fetch(`${ENDPOINT}?${query}`)
  if (!res.ok) {
    throw new Error(`GET ${ENDPOINT} answered ${res.status}`)
  }
  return (await res.json()) as Record<string, number>
}
