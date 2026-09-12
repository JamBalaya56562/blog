"use client"

import { useEffect, useRef, useState } from "react"
import { useToc } from "@/components/toc-context"
import { TocList } from "@/components/toc-list"
import type { Dictionary } from "@/lib/i18n/get-dictionary"

/**
 * The index for widths below `xl`, where there is no room for the floating
 * panel beside the post. A button in the header, the same shell as the
 * hamburger, drops the same full-width panel down from the header bar with
 * the index inside. Renders nothing on pages that publish no index.
 */
export function MobileIndex({
  dictionary,
}: {
  readonly dictionary: Dictionary
}) {
  const { toc } = useToc()
  const [isOpen, setIsOpen] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (timer.current) {
        clearTimeout(timer.current)
      }
    }
  }, [])

  // Leaving the page takes the index with it; the panel must not outlive it.
  useEffect(() => {
    if (!toc) {
      setIsOpen(false)
      setIsClosing(false)
    }
  }, [toc])

  const close = () => {
    setIsClosing(true)
    timer.current = setTimeout(() => {
      setIsOpen(false)
      setIsClosing(false)
    }, 220)
  }

  // Escape closes the panel from wherever focus is. Opening leaves focus on
  // the button, so a handler on the panel itself would never see the key.
  useEffect(() => {
    if (!isOpen) {
      return
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsClosing(true)
        timer.current = setTimeout(() => {
          setIsOpen(false)
          setIsClosing(false)
        }, 220)
      }
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [isOpen])

  if (!toc) {
    return null
  }

  const open = isOpen && !isClosing

  return (
    <div className="xl:hidden">
      <button
        type="button"
        onClick={() => {
          if (isOpen) {
            close()
          } else {
            setIsOpen(true)
          }
        }}
        className="relative flex h-[34px] w-[34px] items-center justify-center border border-transparent transition-colors hover:border-cyber-line-hi"
        aria-label={
          isOpen ? dictionary.nav.closeIndex : dictionary.nav.openIndex
        }
        aria-expanded={isOpen}
        data-testid="mobile-index-button"
      >
        {/* Three left-aligned lines of unequal length — a list, next to the
            hamburger's three equal ones — that fold into the same cross and
            take the same cyan when open. */}
        <span
          className={`absolute left-[7px] h-0.5 transition-all duration-300 ease-in-out ${
            open
              ? "w-5 translate-y-0 rotate-45 bg-cyber-cyan"
              : "w-5 -translate-y-1.5 rotate-0 bg-foreground"
          }`}
        />
        <span
          className={`absolute left-[7px] h-0.5 w-3 bg-cyber-cyan transition-all duration-300 ease-in-out ${
            open ? "scale-x-0 opacity-0" : "scale-x-100 opacity-100"
          }`}
        />
        <span
          className={`absolute left-[7px] h-0.5 transition-all duration-300 ease-in-out ${
            open
              ? "w-5 translate-y-0 -rotate-45 bg-cyber-cyan"
              : "w-4 translate-y-1.5 rotate-0 bg-foreground"
          }`}
        />
      </button>

      {isOpen && (
        <>
          <button
            type="button"
            className={`fixed inset-0 z-40 bg-cyber-bg-0/50 backdrop-blur-[2px] transition-opacity duration-200 ${
              isClosing ? "opacity-0" : "opacity-100"
            }`}
            onClick={close}
            aria-label={dictionary.nav.closeIndex}
          />
          <nav
            aria-label={toc.title}
            className="pp-mpanel flex flex-col px-4 pb-4 pt-3"
            data-closing={isClosing}
          >
            <span aria-hidden className="pp-mpanel-scan" />
            <div className="pp-tick mb-3 text-cyber-cyan">◢ INDEX</div>
            <p className="pp-tick mb-3 text-cyber-dim">{toc.title}</p>
            <TocList
              items={toc.items}
              className="max-h-[60vh]"
              onNavigate={close}
            />
          </nav>
        </>
      )}
    </div>
  )
}
