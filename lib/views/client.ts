const ENDPOINT = "/api/views"

/**
 * Records one view and returns the post's new total, or null when nothing was
 * recorded — a crawler, no database, or a request that failed. The counter
 * treats all of those the same way, so none of them throws.
 */
export async function recordView(slug: string): Promise<number | null> {
  try {
    const res = await fetch(ENDPOINT, {
      body: JSON.stringify({ slug }),
      headers: { "Content-Type": "application/json" },
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
