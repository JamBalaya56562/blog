"use client"

import { useEffect, useState } from "react"

export function ViewCounter({ slug }: { slug: string }) {
  const [count, setCount] = useState<number | null>(null)

  useEffect(() => {
    const encoded = encodeURIComponent(slug)
    const controller = new AbortController()
    const signal = controller.signal
    const timeout = setTimeout(() => controller.abort(), 3000)

    fetch(`/api/views/${encoded}`, { method: "POST", signal })
      .then(() => fetch(`/api/views/${encoded}`, { signal }))
      .then((res) => res.json())
      .then((data) => {
        if (!signal.aborted) setCount(data.count)
      })
      .catch((err) => {
        if (process.env.NODE_ENV === "development" && !signal.aborted) {
          console.error("Failed to update view count", err)
        }
      })
      .finally(() => clearTimeout(timeout))

    return () => controller.abort()
  }, [slug])

  if (count === null) {
    return null
  }

  return <span>{count.toLocaleString()} views</span>
}
