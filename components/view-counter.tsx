"use client"

import { useEffect, useState } from "react"

export function ViewCounter({ slug }: { slug: string }) {
  const [count, setCount] = useState<number | null>(null)

  useEffect(() => {
    const encoded = encodeURIComponent(slug)

    fetch(`/api/views/${encoded}`, { method: "POST" })
      .then(() => fetch(`/api/views/${encoded}`))
      .then((res) => res.json())
      .then((data) => setCount(data.count))
      .catch((err) => {
        if (process.env.NODE_ENV === "development") {
          console.error("Failed to update view count", err)
        }
      })
  }, [slug])

  if (count === null) {
    return null
  }

  return <span>{count.toLocaleString()} views</span>
}
