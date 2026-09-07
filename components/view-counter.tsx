"use client"

import { useEffect, useState } from "react"
import { incrementViewCountAction } from "@/lib/actions/view-count"

export function ViewCounter({ slug, count }: { slug: string; count: number }) {
  const [liveCount, setLiveCount] = useState<number | null>(null)

  useEffect(() => {
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
