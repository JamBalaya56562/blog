"use client"

import { useEffect, useState } from "react"
import type { Dictionary } from "@/lib/i18n/get-dictionary"

export function MobileMenu({
  children,
  dictionary,
}: Readonly<{ children: React.ReactNode; dictionary: Dictionary }>) {
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

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(() => {
      setIsOpen(false)
    }, 250)
  }

  return (
    <div className="md:hidden">
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
        aria-label={isOpen ? dictionary.nav.closeMenu : dictionary.nav.openMenu}
      >
        <span
          className={`absolute h-0.5 w-5 rounded-full bg-foreground transition-all duration-300 ease-in-out ${
            isOpen ? "translate-y-0 rotate-45" : "-translate-y-1.5"
          }`}
        />
        <span
          className={`absolute h-0.5 w-5 rounded-full bg-foreground transition-all duration-300 ease-in-out ${
            isOpen ? "scale-x-0 opacity-0" : "scale-x-100 opacity-100"
          }`}
        />
        <span
          className={`absolute h-0.5 w-5 rounded-full bg-foreground transition-all duration-300 ease-in-out ${
            isOpen ? "translate-y-0 -rotate-45" : "translate-y-1.5"
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
            aria-label={dictionary.nav.closeMenu}
          />
          <div
            className={`absolute right-4 top-full z-50 mt-3 w-auto min-w-[180px] origin-top-right rounded-2xl bg-background/85 px-2 py-3 shadow-2xl ring-1 ring-outline-variant/15 backdrop-blur-2xl transition-all duration-250 ${
              isVisible ? "scale-100 opacity-100" : "scale-90 opacity-0"
            }`}
          >
            <div
              className="flex flex-col gap-0.5"
              role="menu"
              onClick={handleClose}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  handleClose()
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
