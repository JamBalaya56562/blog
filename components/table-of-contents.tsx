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
    <nav className="hidden lg:block fixed top-24 right-[max(2rem,calc((100vw-48rem)/2-15rem))] w-48 rounded-xl border border-gray-200 bg-white/80 p-4 shadow-sm backdrop-blur-sm dark:border-gray-700 dark:bg-gray-900/80">
      <p className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
        {title}
      </p>
      <ul className="space-y-0.5 border-l-2 border-gray-200 text-sm dark:border-gray-700">
        {items.map((item) => (
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
              className={`-ml-px block border-l-2 py-1 pl-3 transition-all ${
                activeId === item.id
                  ? "border-blue-500 font-medium text-blue-600 dark:border-blue-400 dark:text-blue-400"
                  : "border-transparent text-gray-500 hover:border-gray-400 hover:text-gray-900 dark:text-gray-400 dark:hover:border-gray-500 dark:hover:text-gray-200"
              }`}
            >
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
