import { NextResponse } from "next/server"
import { getAllViewCounts } from "@/lib/db/queries"

export async function GET() {
  const results = await getAllViewCounts()
  return NextResponse.json(results)
}
