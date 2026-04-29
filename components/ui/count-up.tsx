"use client"

import { useEffect, useRef, useState } from "react"

/**
 * Animates a number up to `target` once it scrolls into view.
 * Falls back to the static target value if reduced motion is preferred.
 *
 * Format spec is serializable so this can be invoked from server components:
 *   - `padTo`: zero-pad the integer to N digits (e.g. padTo=4 → "0042")
 *   - default: locale-formatted integer with thousands separators
 */
export function CountUp({
  target,
  durationMs = 1400,
  className,
  padTo,
}: {
  readonly target: number
  readonly durationMs?: number
  readonly className?: string
  readonly padTo?: number
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const [val, setVal] = useState(0)
  const [started, setStarted] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) {
      return
    }
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (reduce) {
      setVal(target)
      setStarted(true)
      return
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && !started) {
          setStarted(true)
          io.disconnect()
        }
      },
      { threshold: 0.3 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [started, target])

  useEffect(() => {
    if (!started) {
      return
    }
    let raf = 0
    const t0 = performance.now()
    const tick = (t: number) => {
      const k = Math.min(1, (t - t0) / durationMs)
      const eased = 1 - (1 - k) ** 3
      setVal(Math.round(target * eased))
      if (k < 1) {
        raf = requestAnimationFrame(tick)
      }
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [started, target, durationMs])

  const display = padTo ? String(val).padStart(padTo, "0") : val.toLocaleString()

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  )
}
