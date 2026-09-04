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

/**
 * Records a view and hands back the resulting count.
 *
 * Returning it is what lets the counter show a live number. The pages that
 * render it are `"use cache"` components, so the count they pass down is
 * whatever was cached, and nothing revalidates it — the figure on screen
 * could never move. The caller reads this value instead.
 *
 * Returns `null` when there is no database, or when the write failed, so the
 * caller can leave the server-rendered figure alone rather than showing a
 * zero it just invented.
 */
export async function incrementViewCount(slug: string): Promise<number | null> {
  const db = getDb()
  if (!db) {
    return null
  }

  try {
    const result = await db
      .insert(pageViews)
      .values({ count: 1, slug })
      .onConflictDoUpdate({
        set: {
          count: sql`${pageViews.count} + 1`,
          updatedAt: sql`now()`,
        },
        target: pageViews.slug,
      })
      .returning({ count: pageViews.count })

    return result[0]?.count ?? null
  } catch (e) {
    console.error("[incrementViewCount] failed for slug:", slug, e)
    return null
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
      .select({ count: pageViews.count, slug: pageViews.slug })
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
