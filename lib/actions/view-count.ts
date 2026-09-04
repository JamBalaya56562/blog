"use server"

import { incrementViewCount } from "@/lib/db/queries"

/** Records a view and returns the new count, or `null` if it could not. */
export async function incrementViewCountAction(
  slug: string,
): Promise<number | null> {
  return incrementViewCount(slug)
}
