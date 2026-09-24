"use client"

import { useEffect, useRef, useState } from "react"
import { GlitchCount } from "@/components/glitch-count"
import { useFetchedViewCount } from "@/components/view-counts"
import { recordView } from "@/lib/views/client"
import { stillCounted } from "@/lib/views/recount"

// A request that never answers should not leave the number spinning.
const GIVE_UP_MS = 5000

function countedRecently(slug: string, now: number): boolean {
  try {
    return stillCounted(localStorage.getItem(`blog:viewed:${slug}`), now)
  } catch {
    return false
  }
}

function markCounted(slug: string, now: number): void {
  try {
    localStorage.setItem(`blog:viewed:${slug}`, String(now))
  } catch {}
}

export function ViewCounter({ slug, label }: { slug: string; label: string }) {
  const [liveCount, setLiveCount] = useState<number | null>(null)
  const [writeDone, setWriteDone] = useState(false)
  const [gaveUp, setGaveUp] = useState(false)
  const fetched = useFetchedViewCount(slug)
  // The write this counter has sent, kept across the effect running twice for
  // one mount, as it does in development. The record is only made once the
  // write has landed, so it cannot be what stops the second run sending again.
  const writeRef = useRef<{
    readonly slug: string
    readonly result: Promise<number | null>
  } | null>(null)

  useEffect(() => {
    if (writeRef.current?.slug !== slug) {
      const now = Date.now()
      if (countedRecently(slug, now)) {
        setWriteDone(true)
        return
      }
      // Recorded only when the write reports a count. Recording before it
      // went out meant a POST that failed still held the post as counted for
      // a day, and the reader's visit was never counted at all.
      const result = recordView(slug).then((updated) => {
        if (updated !== null) {
          markCounted(slug, now)
        }
        return updated
      })
      writeRef.current = { result, slug }
    }

    let active = true
    writeRef.current.result.then((updated) => {
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
