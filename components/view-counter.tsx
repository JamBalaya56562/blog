"use client"

import { useEffect, useState } from "react"
import { incrementViewCountAction } from "@/lib/actions/view-count"

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

export function ViewCounter({ slug, count }: { slug: string; count: number }) {
  const [liveCount, setLiveCount] = useState<number | null>(null)

  useEffect(() => {
    if (alreadyCounted(slug)) {
      return
    }
    markCounted(slug)

    let active = true
    incrementViewCountAction(slug).then((updated) => {
      if (active && typeof updated === "number") {
        setLiveCount(updated)
      }
    })
    return () => {
      active = false
    }
  }, [slug])

  return (
    <span>
      <span className="pp-num text-cyber-cyan">
        {(liveCount ?? count).toLocaleString()}
      </span>{" "}
      VIEWS
    </span>
  )
}
