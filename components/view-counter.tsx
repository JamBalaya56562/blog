"use client"

import { useEffect, useState } from "react"
import { incrementViewCountAction } from "@/lib/actions/view-count"

/**
 * Reader count for a post.
 *
 * `count` is the server-rendered figure, and it is always stale: every page
 * that renders this is a `"use cache"` component, so the number is baked into
 * that cache entry and nothing revalidates it. Recording the view returns the
 * new total, so the counter swaps to that as soon as the effect resolves —
 * this view included.
 *
 * The count is taken from the write rather than a second read on the server.
 * Reading it in a slot outside the cache also works, but the extra Suspense
 * boundary makes a client-side navigation wait for the query, which held the
 * outgoing article on screen long enough for its view-transition names to
 * pair with themselves and broke the post-to-post slide on mobile.
 */
export function ViewCounter({ slug, count }: { slug: string; count: number }) {
  const [liveCount, setLiveCount] = useState<number | null>(null)

  useEffect(() => {
    let active = true
    incrementViewCountAction(slug).then((updated) => {
      // A null result means no database or a failed write — keep the rendered
      // figure rather than replacing it with a zero we made up.
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
