"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { getViewCountsAction } from "@/lib/actions/view-count"

/**
 * Live view counts for a group of article cards.
 *
 * The counts are fetched from the browser rather than rendered on the server,
 * for the same reason the post page's own counter is: every page that shows
 * these cards is a `"use cache"` component, so a server-rendered figure is
 * whatever was cached. On Lambda that is the figure baked at build time, since
 * `isrFlushToDisk` is off and a revalidated entry never outlives the instance
 * that produced it. The number on screen would be wrong on every cold start.
 *
 * Reading them here instead of making the pages dynamic keeps the HTML static.
 * Streaming the cards in left a hidden duplicate of the whole page body in the
 * DOM and traded an instant paint for a skeleton.
 */
const ViewCountsContext = createContext<Readonly<
  Record<string, number>
> | null>(null)

export function ViewCountsProvider({
  children,
  slugs,
}: {
  readonly children: React.ReactNode
  readonly slugs: string[]
}) {
  const [counts, setCounts] = useState<Readonly<Record<string, number>> | null>(
    null,
  )

  // Joined rather than passed as an array, so a fresh array of the same slugs
  // on re-render does not refetch.
  const key = slugs.join(",")

  useEffect(() => {
    let active = true
    getViewCountsAction(key ? key.split(",") : []).then((result) => {
      if (active) {
        setCounts(result)
      }
    })
    return () => {
      active = false
    }
  }, [key])

  return (
    <ViewCountsContext.Provider value={counts}>
      {children}
    </ViewCountsContext.Provider>
  )
}

/**
 * The count for one card.
 *
 * `fallback` is the server-rendered figure, used until the fetch resolves and
 * on pages that render no provider. The blog list reads its counts on the
 * server, because it is already dynamic, and passes them down that way.
 */
function useViewCount(slug: string, fallback: number | undefined) {
  return useContext(ViewCountsContext)?.[slug] ?? fallback ?? 0
}

export function ViewStat({
  fallback,
  slug,
}: {
  readonly fallback?: number
  readonly slug: string
}) {
  return (
    <span className="pp-num text-cyber-cyan">
      {useViewCount(slug, fallback).toLocaleString()}
    </span>
  )
}

/**
 * The popularity bar at the foot of a card, scaled against the busiest card in
 * the same group.
 */
export function PopularityBar({
  fallback,
  fallbackMax,
  slug,
}: {
  readonly fallback?: number
  readonly fallbackMax?: number
  readonly slug: string
}) {
  const counts = useContext(ViewCountsContext)
  const count = useViewCount(slug, fallback)
  const max = Math.max(
    ...(counts ? Object.values(counts) : []),
    fallbackMax ?? 0,
    count,
    100,
  )
  const popularity = Math.min(1, Math.max(0.05, count / Math.max(1, max)))

  return (
    <div
      className="pp-bar-fill group-hover:!w-[88%]"
      style={{ width: `${Math.max(popularity * 100, 18)}%` }}
    />
  )
}
