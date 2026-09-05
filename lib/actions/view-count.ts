"use server"

import { getViewCounts, incrementViewCount } from "@/lib/db/queries"

/** Records a view and returns the new count, or `null` if it could not. */
export async function incrementViewCountAction(
  slug: string,
): Promise<number | null> {
  return incrementViewCount(slug)
}

/**
 * Reads the counts for a group of cards.
 *
 * Returns a plain object rather than the Map the query hands back, so it
 * crosses the action boundary as ordinary JSON. Slugs with no row are simply
 * absent, and a database that cannot be reached yields an empty object.
 */
export async function getViewCountsAction(
  slugs: string[],
): Promise<Record<string, number>> {
  return Object.fromEntries(await getViewCounts(slugs))
}
