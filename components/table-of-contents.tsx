"use client"

import { useEffect, useRef, useState } from "react"
import type { TocItem } from "@/lib/toc"

export function TableOfContents({
  items,
  title,
}: {
  items: TocItem[]
  title: string
}) {
  const [activeId, setActiveId] = useState("")
  const [scrolling, setScrolling] = useState(false)
  const listRef = useRef<HTMLUListElement>(null)
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // The scrollbar shows only while the list is moving. It is a hint that
  // there is more below, not a control the reader needs to see at rest.
  function handleScroll() {
    setScrolling(true)
    if (scrollTimerRef.current) {
      clearTimeout(scrollTimerRef.current)
    }
    scrollTimerRef.current = setTimeout(() => setScrolling(false), 700)
  }

  useEffect(() => {
    return () => {
      if (scrollTimerRef.current) {
        clearTimeout(scrollTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        }
      },
      { rootMargin: "0px 0px -80% 0px", threshold: 0 },
    )
    for (const item of items) {
      const el = document.getElementById(item.id)
      if (el) {
        observer.observe(el)
      }
    }
    return () => observer.disconnect()
  }, [items])

  // The list scrolls on its own once it is taller than the viewport allows,
  // so the highlighted entry has to be brought into that scroller as the
  // reader moves through the post — otherwise it drifts out of sight and the
  // index stops saying where they are.
  useEffect(() => {
    const list = listRef.current
    if (!activeId || !list) {
      return
    }
    const link = list.querySelector<HTMLElement>(
      `a[href="#${CSS.escape(activeId)}"]`,
    )
    if (!link) {
      return
    }
    // Adjust the list's own scroll position rather than calling
    // `scrollIntoView`, which would also be free to move the window — and
    // the window is what the reader is scrolling right now.
    const top = link.offsetTop - list.offsetTop
    const bottom = top + link.offsetHeight
    if (top < list.scrollTop) {
      list.scrollTop = top
    } else if (bottom > list.scrollTop + list.clientHeight) {
      list.scrollTop = bottom - list.clientHeight
    }
  }, [activeId])

  if (items.length === 0) {
    return null
  }

  return (
    // `max-h` keeps the panel inside the viewport: 8rem for its own `top`,
    // 2rem of breathing room below. The list is the part that scrolls, so the
    // INDEX label and the title stay put however long the post is.
    <nav className="hidden xl:flex xl:flex-col fixed top-32 right-[max(1.5rem,calc((100vw-72rem)/2-2rem))] w-56 max-h-[calc(100vh-10rem)] border border-cyber-line bg-cyber-bg-1/60 p-4 backdrop-blur-md">
      <div className="pp-tick mb-3 text-cyber-cyan">◢ INDEX</div>
      <p className="pp-tick mb-3 text-cyber-dim">{title}</p>
      <ul
        ref={listRef}
        onScroll={handleScroll}
        data-scrolling={scrolling || undefined}
        className="pp-toc-list min-h-0 space-y-1 overflow-y-auto border-l border-cyber-line text-sm"
      >
        {items.map((item) => {
          const active = activeId === item.id
          return (
            <li
              key={item.id}
              style={{ paddingLeft: `${(item.level - 2) * 0.75 + 0.75}rem` }}
            >
              <a
                href={`#${item.id}`}
                onClick={(e) => {
                  e.preventDefault()
                  document.getElementById(item.id)?.scrollIntoView({
                    behavior: window.matchMedia(
                      "(prefers-reduced-motion: reduce)",
                    ).matches
                      ? "auto"
                      : "smooth",
                  })
                  window.history.pushState(null, "", `#${item.id}`)
                }}
                className={`-ml-px block border-l-2 py-1 pl-3 font-mono text-[11px] transition-all ${
                  active
                    ? "border-cyber-cyan text-cyber-cyan"
                    : "border-transparent text-cyber-dim hover:border-cyber-line-hi hover:text-foreground"
                }`}
              >
                {item.text}
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
