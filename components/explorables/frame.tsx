import type { ReactNode } from "react"

type Props = Readonly<{
  /**
   * Every state this region can be in, in a stable order. The frame is as
   * tall as the tallest of them, so showing another one moves nothing.
   */
  panes: readonly ReactNode[]
  /** Which one the reader sees. */
  active: number
}>

/**
 * A region of a figure that keeps its height as its contents change.
 *
 * A figure that grows a row when a command is pressed pushes the article
 * under it down the page, and the reader loses the line they were on. The
 * fix is to take the room for the tallest state up front — but a height
 * written into the stylesheet would be a number that is right at one width
 * and wrong at every other, and wrong again the next time a line in the MDX
 * gets longer.
 *
 * So the states are stacked instead: every pane is laid into the same grid
 * cell, which makes the cell as tall as the tallest of them at whatever
 * width it is being read at, with nothing to keep in step by hand. The ones
 * that are not current are hidden with `visibility`, which takes them out of
 * the tab order and out of the accessibility tree while they keep holding
 * their space; `inert` says the same thing to anything that reads the DOM
 * rather than the layout.
 *
 * The cost is that the figure is as tall as its tallest state even when it
 * is showing its shortest, so the panes handed to it should be states the
 * reader can actually reach — the steps of a sequence, the presets of an
 * input — rather than a worst case nobody sees.
 */
export function Frame({ panes, active }: Props) {
  return (
    <div className="pp-explorable-frame">
      {panes.map((pane, index) => (
        <div
          aria-hidden={index === active ? undefined : "true"}
          className="pp-explorable-pane"
          data-active={index === active}
          inert={index !== active}
          // The panes are a fixed list in a fixed order; there is nothing
          // else to key them by.
          // biome-ignore lint/suspicious/noArrayIndexKey: the order is fixed
          key={index}
        >
          {pane}
        </div>
      ))}
    </div>
  )
}
