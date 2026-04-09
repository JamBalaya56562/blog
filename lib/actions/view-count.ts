"use server"

import { incrementViewCount } from "@/lib/db/queries"

export async function incrementViewCountAction(slug: string): Promise<void> {
  await incrementViewCount(slug)
}
