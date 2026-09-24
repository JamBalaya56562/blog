"use client"

import { useEffect, useState } from "react"
import { GlitchCount } from "@/components/glitch-count"
import { useFetchedViewCount } from "@/components/view-counts"
import { incrementViewCountAction } from "@/lib/actions/view-count"

// A request that never answers should not leave the number spinning.
const GIVE_UP_MS = 5000

function alreadyCounted(slug: string): boolean {
  try {
    return localStorage.getItem(`blog:viewed:${slug}`) !== null
  } catch {
    return false
  }
}

function markCounted(slug: string): void {
  try {
    localStorage.setItem(`blog:viewed:${slug}`, "1")
  } catch {}
}

export function ViewCounter({
  slug,
  count,
  label,
}: {
  slug: string
  count: number
  label: string
}) {
  const [liveCount, setLiveCount] = useState<number | null>(null)
  const [writeDone, setWriteDone] = useState(false)
  const [gaveUp, setGaveUp] = useState(false)
  const fetched = useFetchedViewCount(slug)

  useEffect(() => {
    if (alreadyCounted(slug)) {
      setWriteDone(true)
      return
    }
    markCounted(slug)

    let active = true
    incrementViewCountAction(slug)
      .then((updated) => {
        if (active && typeof updated === "number") {
          setLiveCount(updated)
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) {
          setWriteDone(true)
        }
      })
    return () => {
      active = false
    }
  }, [slug])

  useEffect(() => {
    const id = setTimeout(() => setGaveUp(true), GIVE_UP_MS)
    return () => clearTimeout(id)
  }, [])

  // The write's figure is the newest one, so on a first visit the read alone
  // is not enough to settle: it may have been answered before the write
  // landed. The rendered `count` is the last resort, frozen into the cache.
  const settled = liveCount !== null || (fetched.settled && writeDone) || gaveUp
  const value = settled ? (liveCount ?? fetched.count ?? count) : null

  return (
    <span className="whitespace-nowrap">
      <GlitchCount value={value} /> {label}
    </span>
  )
}
