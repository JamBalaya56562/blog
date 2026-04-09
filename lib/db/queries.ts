import { desc, eq, inArray, sql } from "drizzle-orm"
import { getDb } from "."
import { pageViews } from "./schema"

export async function getViewCount(slug: string): Promise<number> {
  const db = getDb()
  if (!db) {
    return 0
  }

  try {
    const result = await db
      .select({ count: pageViews.count })
      .from(pageViews)
      .where(eq(pageViews.slug, slug))
      .limit(1)

    return result[0]?.count ?? 0
  } catch (e) {
    console.error("[getViewCount] failed for slug:", slug, e)
    return 0
  }
}

export async function incrementViewCount(slug: string): Promise<void> {
  const db = getDb()
  if (!db) {
    return
  }

  try {
    await db
      .insert(pageViews)
      .values({ slug, count: 1 })
      .onConflictDoUpdate({
        target: pageViews.slug,
        set: {
          count: sql`${pageViews.count} + 1`,
          updatedAt: sql`now()`,
        },
      })
  } catch (e) {
    console.error("[incrementViewCount] failed for slug:", slug, e)
  }
}

export async function getViewCounts(
  slugs: string[],
): Promise<Map<string, number>> {
  const db = getDb()
  if (!db || slugs.length === 0) {
    return new Map()
  }

  try {
    const results = await db
      .select({ slug: pageViews.slug, count: pageViews.count })
      .from(pageViews)
      .where(inArray(pageViews.slug, slugs))

    return new Map(results.map((r) => [r.slug, r.count]))
  } catch (e) {
    console.error("[getViewCounts] failed for slugs:", slugs, e)
    return new Map()
  }
}

export async function getAllViewCounts() {
  const db = getDb()
  if (!db) {
    return []
  }

  try {
    return await db.select().from(pageViews).orderBy(desc(pageViews.count))
  } catch (e) {
    console.error("[getAllViewCounts] failed:", e)
    return []
  }
}
