"use client"

import { useEffect, useState } from "react"
import { useToc } from "@/components/toc-context"
import { TocList } from "@/components/toc-list"
import type { Dictionary } from "@/lib/i18n/get-dictionary"

/**
 * The index for widths below `xl`, where there is no room for the floating
 * panel beside the post. A button in the header, built and animated the
 * same way as the hamburger, drops the same list down from the header bar.
 * Renders nothing on pages that publish no index.
 */
export function MobileIndex({
  dictionary,
}: {
  readonly dictionary: Dictionary
}) {
  const { toc } = useToc()
  const [isOpen, setIsOpen] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => {
        setIsVisible(true)
      })
    } else {
      setIsVisible(false)
    }
  }, [isOpen])

  // Leaving the page takes the index with it; the panel must not outlive it.
  useEffect(() => {
    if (!toc) {
      setIsOpen(false)
    }
  }, [toc])

  // Escape closes the panel from wherever focus is. Opening leaves focus on
  // the button, so a handler on the panel itself would never see the key.
  useEffect(() => {
    if (!isOpen) {
      return
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsVisible(false)
        setTimeout(() => setIsOpen(false), 250)
      }
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [isOpen])

  if (!toc) {
    return null
  }

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(() => {
      setIsOpen(false)
    }, 250)
  }

  return (
    <div className="xl:hidden">
      <button
        type="button"
        onClick={() => {
          if (isOpen) {
            handleClose()
          } else {
            setIsOpen(true)
          }
        }}
        className="relative flex h-8 w-8 items-center justify-center"
        aria-label={
          isOpen ? dictionary.nav.closeIndex : dictionary.nav.openIndex
        }
        aria-expanded={isOpen}
        data-testid="mobile-index-button"
      >
        {/* Three left-aligned lines of unequal length — a list, next to the
            hamburger's three equal ones — that fold into the same cross. */}
        <span
          className={`absolute left-1.5 h-0.5 rounded-full bg-foreground transition-all duration-300 ease-in-out ${
            isOpen
              ? "w-5 translate-y-0 rotate-45"
              : "w-5 -translate-y-1.5 rotate-0"
          }`}
        />
        <span
          className={`absolute left-1.5 h-0.5 rounded-full bg-cyber-cyan transition-all duration-300 ease-in-out ${
            isOpen ? "w-3 scale-x-0 opacity-0" : "w-3 scale-x-100 opacity-100"
          }`}
        />
        <span
          className={`absolute left-1.5 h-0.5 rounded-full bg-foreground transition-all duration-300 ease-in-out ${
            isOpen
              ? "w-5 translate-y-0 -rotate-45"
              : "w-4 translate-y-1.5 rotate-0"
          }`}
        />
      </button>

      {isOpen && (
        <>
          <button
            type="button"
            className={`fixed inset-0 z-40 bg-black/10 backdrop-blur-[2px] transition-opacity duration-250 ${
              isVisible ? "opacity-100" : "opacity-0"
            }`}
            onClick={handleClose}
            aria-label={dictionary.nav.closeIndex}
          />
          <nav
            aria-label={toc.title}
            className={`absolute right-4 top-full z-50 mt-3 flex w-[min(20rem,calc(100vw-2rem))] origin-top-right flex-col rounded-2xl bg-background p-4 shadow-2xl ring-1 ring-cyber-line transition-all duration-250 ${
              isVisible ? "scale-100 opacity-100" : "scale-90 opacity-0"
            }`}
          >
            <div className="pp-tick mb-3 text-cyber-cyan">◢ INDEX</div>
            <p className="pp-tick mb-3 text-cyber-dim">{toc.title}</p>
            <TocList
              items={toc.items}
              className="max-h-[60vh]"
              onNavigate={handleClose}
            />
          </nav>
        </>
      )}
    </div>
  )
}
