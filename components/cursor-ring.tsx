"use client"

import { useEffect, useRef, useState } from "react"

export function CursorRing() {
  const ringRef = useRef<HTMLDivElement>(null)
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (!fine || reduce) {
      return
    }
    setEnabled(true)
  }, [])

  useEffect(() => {
    if (!enabled) {
      return
    }
    const ring = ringRef.current
    if (!ring) {
      return
    }

    const interactiveSelector =
      "a, button, input, textarea, select, [role=button], [role=tab], [role=link], .pp-link, .pp-tag, [data-pp-interactive]"

    let lastX = -100
    let lastY = -100
    let raf = 0
    const apply = () => {
      ring.style.left = `${lastX}px`
      ring.style.top = `${lastY}px`
      raf = 0
    }

    const onMove = (e: MouseEvent) => {
      lastX = e.clientX
      lastY = e.clientY
      if (!raf) {
        raf = requestAnimationFrame(apply)
      }
      ring.dataset.visible = "true"
      const target = e.target as Element | null
      const interactive = target?.closest(interactiveSelector)
      ring.dataset.active = interactive ? "true" : "false"
    }
    const onEnter = () => {
      ring.dataset.visible = "true"
    }
    const onLeave = () => {
      ring.dataset.visible = "false"
    }

    window.addEventListener("mousemove", onMove, { passive: true })
    document.addEventListener("mouseenter", onEnter)
    document.addEventListener("mouseleave", onLeave)
    return () => {
      if (raf) {
        cancelAnimationFrame(raf)
      }
      window.removeEventListener("mousemove", onMove)
      document.removeEventListener("mouseenter", onEnter)
      document.removeEventListener("mouseleave", onLeave)
    }
  }, [enabled])

  if (!enabled) {
    return null
  }

  return <div ref={ringRef} className="pp-cursor-ring" aria-hidden />
}
