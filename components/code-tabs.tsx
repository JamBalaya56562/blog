"use client"

import { Children, isValidElement, useId, useRef, useState } from "react"

/**
 * A tabbed group of code blocks, for the same instruction written for more than
 * one platform.
 *
 * Authored in MDX by handing it fenced code blocks and the labels that go with
 * them, in the same order:
 *
 *     <CodeTabs labels={["macOS / Linux", "Windows"]}>
 *
 *     ```bash
 *     curl -fsSL https://mise.run | sh
 *     ```
 *
 *     ```powershell
 *     winget install jdx.mise
 *     ```
 *
 *     </CodeTabs>
 *
 * The blank lines around the fences are what makes MDX parse them as markdown
 * rather than as JSX text, and going through the normal fence keeps the
 * highlighting: `rehypeHighlight` walks the whole tree, so it reaches these the
 * same way it reaches a code block that stands on its own.
 *
 * Panels are matched to labels by position, so anything else placed between the
 * fences would take a label away from the block after it. Every panel stays in
 * the markup, hidden rather than unmounted, so the text is present for search
 * engines and for a reader who arrives before hydration.
 */
export function CodeTabs({
  labels,
  children,
}: {
  readonly labels: readonly string[]
  readonly children: React.ReactNode
}) {
  const panels = Children.toArray(children).filter(isValidElement)
  const [active, setActive] = useState(0)
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
  const id = useId()

  if (panels.length !== labels.length) {
    throw new Error(
      `CodeTabs: ${labels.length} labels but ${panels.length} code blocks`,
    )
  }

  // Arrow keys move between tabs, wrapping at both ends, and take the focus
  // with them: with a roving tabindex the unselected tabs are not tab stops, so
  // moving selection without moving focus would strand the keyboard user.
  function onKeyDown(event: React.KeyboardEvent, index: number) {
    const offset =
      event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0
    if (offset === 0) {
      return
    }
    event.preventDefault()
    const next = (index + offset + panels.length) % panels.length
    setActive(next)
    tabRefs.current[next]?.focus()
  }

  return (
    <div className="pp-tabs">
      <div className="pp-tabs-list" role="tablist">
        {labels.map((label, index) => (
          <button
            aria-controls={`${id}-panel-${index}`}
            aria-selected={index === active}
            className="pp-tabs-tab"
            id={`${id}-tab-${index}`}
            key={label}
            onClick={() => setActive(index)}
            onKeyDown={(event) => onKeyDown(event, index)}
            ref={(node) => {
              tabRefs.current[index] = node
            }}
            role="tab"
            tabIndex={index === active ? 0 : -1}
            type="button"
          >
            {label}
          </button>
        ))}
      </div>
      {panels.map((panel, index) => (
        <div
          aria-labelledby={`${id}-tab-${index}`}
          hidden={index !== active}
          id={`${id}-panel-${index}`}
          key={labels[index]}
          role="tabpanel"
        >
          {panel}
        </div>
      ))}
    </div>
  )
}
