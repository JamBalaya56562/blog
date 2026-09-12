"use client"

import { useEffect, useRef, useState } from "react"
import type { Dictionary } from "@/lib/i18n/get-dictionary"

/**
 * The below-md navigation menu.
 *
 * The panel drops from the bottom edge of the header across its full width: it
 * opens by pulling its own clip-path down, a scan line runs the height once,
 * and the items arrive in sequence behind it. Closing runs the clip the other
 * way, so `isOpen` (mounted) and `isClosing` (playing the exit) are separate —
 * unmounting on click would cut the exit animation off.
 *
 * The `children` API is unchanged from the previous version: the header still
 * passes the links, and their styling comes from `.pp-mi` in globals.css.
 */
export function MobileMenu({
  children,
  dictionary,
}: Readonly<{ children: React.ReactNode; dictionary: Dictionary }>) {
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

  const close = () => {
    setIsClosing(true)
    timer.current = setTimeout(() => {
      setIsOpen(false)
      setIsClosing(false)
    }, 220)
  }

  // Escape closes from anywhere while the panel is up, which a keyboard user
  // reaching the links needs — the links themselves are not the only focus
  // target inside the panel.
  useEffect(() => {
    if (!isOpen) {
      return
    }
    // Written out rather than calling `close`: that function is a new
    // value on every render, and an effect keyed on it would re-run each time.
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsClosing(true)
        timer.current = setTimeout(() => {
          setIsOpen(false)
          setIsClosing(false)
        }, 220)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => {
      window.removeEventListener("keydown", onKey)
    }
  }, [isOpen])

  return (
    <div className="md:hidden">
      <button
        type="button"
        className="pp-burger"
        data-open={isOpen && !isClosing}
        aria-expanded={isOpen}
        aria-label={isOpen ? dictionary.nav.closeMenu : dictionary.nav.openMenu}
        onClick={() => {
          if (isOpen) {
            close()
          } else {
            setIsOpen(true)
          }
        }}
      >
        <span />
        <span />
        <span />
      </button>

      {isOpen && (
        <>
          <button
            type="button"
            className={`fixed inset-0 z-40 bg-cyber-bg-0/50 backdrop-blur-[2px] transition-opacity duration-200 ${
              isClosing ? "opacity-0" : "opacity-100"
            }`}
            onClick={close}
            aria-label={dictionary.nav.closeMenu}
          />
          {/* Anchored to the header, not to this button, so the panel spans the
              whole bar: the header element is the containing block. */}
          <div className="pp-mpanel" data-closing={isClosing}>
            <span aria-hidden className="pp-mpanel-scan" />
            <div
              className="pp-mitems flex flex-col py-1.5"
              role="menu"
              onClick={close}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  close()
                }
              }}
            >
              {children}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
