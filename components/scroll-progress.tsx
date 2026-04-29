"use client"

import { useEffect, useState } from "react"

/**
 * Sticky scroll-progress bar shown at the top of post pages.
 * Spans cyan → amber gradient. Hidden under reduced-motion via globals.css
 * (the bar still renders, but no animation flicker).
 */
export function ScrollProgress() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      setProgress(max > 0 ? Math.min(1, window.scrollY / max) : 0)
    }
    update()
    window.addEventListener("scroll", update, { passive: true })
    window.addEventListener("resize", update)
    return () => {
      window.removeEventListener("scroll", update)
      window.removeEventListener("resize", update)
    }
  }, [])

  return (
    <div aria-hidden className="sticky top-0 z-30 h-0.5 bg-cyber-cyan/10">
      <div
        className="h-full bg-gradient-to-r from-cyber-cyan to-cyber-amber"
        style={{ width: `${progress * 100}%` }}
      />
    </div>
  )
}
