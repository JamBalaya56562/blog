"use server"

import { getViewCounts, incrementViewCount } from "@/lib/db/queries"

export async function incrementViewCountAction(
  slug: string,
): Promise<number | null> {
  return incrementViewCount(slug)
}

export async function getViewCountsAction(
  slugs: string[],
): Promise<Record<string, number>> {
  return Object.fromEntries(await getViewCounts(slugs))
}
