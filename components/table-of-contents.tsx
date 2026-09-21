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
    // The panel is placed by the post's column rather than by arithmetic on
    // the viewport: the track is `left-full` on that column, so its left edge
    // is the column's right edge by construction. The `fixed left-1/2 ml-96`
    // this replaced had to reason about which width the classic scrollbar is
    // inside of — `left` resolves against the box the column is centred in,
    // `100vw` counts the scrollbar — and an earlier `right: max(1.5rem,
    // calc((100vw - 72rem)/2 - 2rem))` got it wrong by half a scrollbar.
    //
    // The track spans the column's height and the panel is `sticky` in it,
    // which is what ends the panel where the post ends. Fixed, it held its
    // line over the gap above the footer and indexed a post that was no
    // longer beside it; the footer covered it only because the footer is
    // painted later. `top-32` is still the resting line — sticky pushes the
    // panel down to it at the top of the page, and holds it there until the
    // column's end takes it up and away.
    //
    // `max-h` keeps it inside the viewport: 8rem for its own `top`, 2rem of
    // breathing room below. The list is the part that scrolls, so the INDEX
    // label and the title stay put however long the post is.
    //
    // Below `xl` nothing fits beside a 48rem column, so the track is not
    // rendered at all and the header's index button is the way in.
    //
    // The track is otherwise empty and as tall as the post, so it does not
    // take the pointer: a drag that starts in the margin selects the text
    // below it the way it did before the track existed.
    <div className="pointer-events-none absolute inset-y-0 left-full hidden w-60 xl:block">
      <nav
        className="pointer-events-auto sticky top-32 flex max-h-[calc(100vh-10rem)] flex-col border border-cyber-line bg-cyber-bg-1/60 p-4 backdrop-blur-md"
        data-testid="post-index"
      >
        <div className="pp-tick mb-3 text-cyber-cyan">◢ INDEX</div>
        <p className="pp-tick mb-3 text-cyber-dim">{title}</p>
        <TocList items={items} />
      </nav>
    </div>
  )
}
