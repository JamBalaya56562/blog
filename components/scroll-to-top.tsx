"use client"

import { ArrowUp } from "lucide-react"
import { useEffect, useState } from "react"
import type { Dictionary } from "@/lib/i18n/get-dictionary"

export function ScrollToTop({
  dictionary,
}: Readonly<{ dictionary: Dictionary }>) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 300)
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => {
      window.removeEventListener("scroll", handleScroll)
    }
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label={dictionary.nav.scrollToTop}
      className={`fixed bottom-6 right-6 z-50 flex h-11 w-11 items-center justify-center border border-cyber-cyan bg-cyber-bg-0/85 text-cyber-cyan backdrop-blur-md transition-all duration-300 hover:bg-cyber-cyan hover:text-cyber-bg-0 active:scale-95 ${
        visible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-4 opacity-0"
      }`}
    >
      <ArrowUp size={18} strokeWidth={2} />
    </button>
  )
}
