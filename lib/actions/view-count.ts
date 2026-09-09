"use server"

import { headers } from "next/headers"
import { isReader } from "@/lib/actions/reader"
import { getViewCounts, incrementViewCount } from "@/lib/db/queries"

export async function incrementViewCountAction(
  slug: string,
): Promise<number | null> {
  if (!isReader((await headers()).get("user-agent"))) {
    return null
  }

  return incrementViewCount(slug)
}

export async function getViewCountsAction(
  slugs: string[],
): Promise<Record<string, number>> {
  return Object.fromEntries(await getViewCounts(slugs))
}
