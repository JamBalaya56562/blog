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
    // The panel hangs off the right edge of the post's column: the column is
    // `max-w-3xl` centred, so that edge is half the viewport plus 24rem,
    // which is what `left-1/2 ml-96` says. Measuring from the left is what
    // makes it exact. `left` resolves against this element's containing
    // block, which is the viewport with the classic scrollbar's width
    // already taken out — the same width the column is centred in. The
    // `right: max(1.5rem, calc((100vw - 72rem)/2 - 2rem))` this replaced
    // mixed the two: `100vw` counts that scrollbar, so the panel sat half a
    // scrollbar (7.5px of the usual 15) inside the column's padding.
    // Keeping the panel on screen is the breakpoint's job — below `xl`
    // nothing fits beside a 48rem column, so there is no panel to place.
    // `max-h` keeps it inside the viewport: 8rem for its own `top`, 2rem of
    // breathing room below. The list is the part that scrolls, so the INDEX
    // label and the title stay put however long the post is.
    <nav
      className="hidden xl:flex xl:flex-col fixed top-32 left-1/2 ml-96 w-56 max-h-[calc(100vh-10rem)] border border-cyber-line bg-cyber-bg-1/60 p-4 backdrop-blur-md"
      data-testid="post-index"
    >
      <div className="pp-tick mb-3 text-cyber-cyan">◢ INDEX</div>
      <p className="pp-tick mb-3 text-cyber-dim">{title}</p>
      <TocList items={items} />
    </nav>
  )
}
