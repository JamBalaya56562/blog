"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { getViewCountsAction } from "@/lib/actions/view-count"

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
