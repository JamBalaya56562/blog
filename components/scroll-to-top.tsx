"use client"

import { ArrowUp } from "lucide-react"
import { useEffect, useState } from "react"
import type { Dictionary } from "@/lib/i18n/get-dictionary"

const RADIUS = 25
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

/**
 * Back-to-top button with the reading progress drawn around it as an arc.
 *
 * The progress figure is the same one `ScrollProgress` shows as a top bar
 * (`scrollY / (scrollHeight - innerHeight)`), read from its own listener so the
 * two components stay independent.
 */
export function ScrollToTop({
  dictionary,
}: Readonly<{ dictionary: Dictionary }>) {
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

  const visible = progress > 0.04

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 h-14 w-14 transition-all duration-300 ${
        visible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-4 opacity-0"
      }`}
    >
      <svg
        aria-hidden
        viewBox="0 0 56 56"
        className="absolute inset-0 -rotate-90"
      >
        <circle
          cx="28"
          cy="28"
          r={RADIUS}
          fill="none"
          strokeWidth="2"
          className="stroke-cyber-cyan/20"
        />
        <circle
          cx="28"
          cy="28"
          r={RADIUS}
          fill="none"
          strokeWidth="2"
          className="stroke-cyber-cyan"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
          style={{ transition: "stroke-dashoffset 0.15s linear" }}
        />
      </svg>
      <button
        type="button"
        onClick={() => {
          window.scrollTo({ behavior: "smooth", top: 0 })
        }}
        aria-label={dictionary.nav.scrollToTop}
        className="absolute left-[5px] top-[5px] flex h-[46px] w-[46px] items-center justify-center border border-cyber-cyan/35 bg-cyber-bg-0/85 text-cyber-cyan backdrop-blur-md transition-colors duration-250 hover:bg-cyber-cyan hover:text-cyber-bg-0 active:scale-95"
      >
        <ArrowUp size={18} strokeWidth={2} />
      </button>
    </div>
  )
}
