"use client"

import { useEffect } from "react"
import { incrementViewCountAction } from "@/lib/actions/view-count"

export function ViewCounter({ slug, count }: { slug: string; count: number }) {
  useEffect(() => {
    incrementViewCountAction(slug)
  }, [slug])

  return (
    <span>
      <span className="pp-num text-cyber-cyan">{count.toLocaleString()}</span>{" "}
      VIEWS
    </span>
  )
}
