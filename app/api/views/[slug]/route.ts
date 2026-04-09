import { sql } from "drizzle-orm"
import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { pageViews } from "@/lib/db/schema"

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const db = getDb()
  if (!db) {
    return NextResponse.json(
      { success: false, error: "DB unavailable" },
      { status: 503 },
    )
  }

  const { slug } = await params

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

  return NextResponse.json({ success: true })
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const db = getDb()
  if (!db) {
    return NextResponse.json({ slug: (await params).slug, count: 0 })
  }

  const { slug } = await params

  const result = await db
    .select({ count: pageViews.count })
    .from(pageViews)
    .where(sql`${pageViews.slug} = ${slug}`)
    .limit(1)

  return NextResponse.json({ slug, count: result[0]?.count ?? 0 })
}
