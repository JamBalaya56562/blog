"use client"

import { useEffect } from "react"
import { useToc } from "@/components/toc-context"
import { TocList } from "@/components/toc-list"
import type { TocItem } from "@/lib/toc"

export function TableOfContents({
  items,
  title,
}: {
  items: TocItem[]
  title: string
}) {
  const { setToc } = useToc()

  // Publish the index for the header's button, which is the way in below
  // `xl` where this panel is not shown; take it back down when the post
  // unmounts so the button does not linger on the next page.
  useEffect(() => {
    if (items.length === 0) {
      return
    }
    setToc({ items, title })
    return () => setToc(null)
  }, [items, title, setToc])

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
      <TocList items={items} />
    </nav>
  )
}
