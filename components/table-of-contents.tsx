"use client"

import { useEffect, useState } from "react"
import type { TocItem } from "@/lib/toc"

export function TableOfContents({
  items,
  title,
}: {
  items: TocItem[]
  title: string
}) {
  const [activeId, setActiveId] = useState("")

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

  if (items.length === 0) {
    return null
  }

  return (
    <nav className="hidden xl:block fixed top-32 right-[max(1.5rem,calc((100vw-72rem)/2-2rem))] w-56 border border-cyber-line bg-cyber-bg-1/60 p-4 backdrop-blur-md">
      <div className="pp-tick mb-3 text-cyber-cyan">◢ INDEX</div>
      <p className="pp-tick mb-3 text-cyber-dim">{title}</p>
      <ul className="space-y-1 border-l border-cyber-line text-sm">
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
                  document
                    .getElementById(item.id)
                    ?.scrollIntoView({ behavior: "smooth" })
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
