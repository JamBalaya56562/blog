import { desc, inArray } from "drizzle-orm"
import { getDb } from "."
import { pageViews } from "./schema"

export async function getViewCounts(
  slugs: string[],
): Promise<Map<string, number>> {
  const db = getDb()
  if (!db || slugs.length === 0) {
    return new Map()
  }

  const results = await db
    .select({ slug: pageViews.slug, count: pageViews.count })
    .from(pageViews)
    .where(inArray(pageViews.slug, slugs))

  return new Map(results.map((r) => [r.slug, r.count]))
}

export async function getAllViewCounts() {
  const db = getDb()
  if (!db) {
    return []
  }

  return db.select().from(pageViews).orderBy(desc(pageViews.count))
}
