"use client"

import { useEffect, useState } from "react"
import { GlitchCount } from "@/components/glitch-count"
import { useFetchedViewCount } from "@/components/view-counts"
import { recordView } from "@/lib/views/client"

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

export function ViewCounter({ slug, label }: { slug: string; label: string }) {
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
    recordView(slug).then((updated) => {
      if (!active) {
        return
      }
      if (updated !== null) {
        setLiveCount(updated)
      }
      setWriteDone(true)
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
  // landed. A post the read has no count for has not been viewed. The page
  // carries no figure of its own: one read at render time was frozen into the
  // cache entry, zero on Lambda, and only ever shown when both of these had
  // failed.
  const settled = liveCount !== null || (fetched.settled && writeDone) || gaveUp
  const value = settled ? (liveCount ?? fetched.count ?? 0) : null

  return (
    <span className="whitespace-nowrap">
      <GlitchCount value={value} /> {label}
    </span>
  )
}
