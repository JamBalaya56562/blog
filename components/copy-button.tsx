"use client"

import { usePathname } from "next/navigation"
import { useEffect, useRef, useState, useSyncExternalStore } from "react"
import { isValidLocale } from "@/lib/i18n/config"
import { getDictionary } from "@/lib/i18n/get-dictionary"
import { PROMPT_LINE } from "@/lib/prompt-line"

/**
 * Copy button for a code block.
 *
 * It reads the text out of the `<pre>` beside it rather than taking a string
 * prop, because the MDX pipeline hands the highlighted markup to `pre` as
 * React children and rebuilding the plain text from that tree would have to
 * know about every node `rehypeHighlight` emits. `textContent` on the rendered
 * element is the same text the reader sees.
 *
 * The label comes from the dictionary for the locale in the URL: the MDX
 * component map has no locale to hand down, and the pathname does.
 *
 * In a terminal transcript (`commands`), only the lines the highlighter
 * marked as commands are copied, with their prompt taken off, so what lands
 * in the clipboard can be pasted straight back into a shell. A transcript
 * with no marked line falls back to the whole text.
 *
 * Renders nothing where the Clipboard API is unavailable (a non-secure origin,
 * say), so there is no button that cannot do anything. That check goes through
 * `useSyncExternalStore` rather than an effect: with the check in an effect,
 * the post hero picked up a view-transition-name on plain page load, which
 * broke the navigation tests.
 */
const subscribe = () => () => {}
const hasClipboard = () => Boolean(navigator.clipboard?.writeText)
const noClipboard = () => false

/** The prompt and the spaces after it, as `PROMPT_LINE` reads them. */
const PROMPT_PREFIX = new RegExp(`${PROMPT_LINE.source}+`)

function textToCopy(pre: HTMLElement, commands: boolean): string {
  if (!commands) {
    return pre.textContent ?? ""
  }
  const lines = Array.from(pre.querySelectorAll("[data-cmd]"))
  if (lines.length === 0) {
    return pre.textContent ?? ""
  }
  return lines
    .map((line) => (line.textContent ?? "").replace(PROMPT_PREFIX, ""))
    .join("\n")
}

export function CopyButton({
  commands = false,
}: Readonly<{ commands?: boolean }>) {
  const [copied, setCopied] = useState(false)
  const enabled = useSyncExternalStore(subscribe, hasClipboard, noClipboard)
  const ref = useRef<HTMLButtonElement>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pathname = usePathname()
  const segment = pathname.split("/")[1] ?? ""
  const dictionary = getDictionary(isValidLocale(segment) ? segment : "en")

  useEffect(() => {
    return () => {
      if (timer.current) {
        clearTimeout(timer.current)
      }
    }
  }, [])

  if (!enabled) {
    return null
  }

  const copy = async () => {
    const pre = ref.current?.parentElement?.querySelector("pre")
    const text = pre ? textToCopy(pre, commands) : ""
    if (!text) {
      return
    }
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      return
    }
    setCopied(true)
    if (timer.current) {
      clearTimeout(timer.current)
    }
    timer.current = setTimeout(() => {
      setCopied(false)
    }, 1600)
  }

  return (
    <button
      type="button"
      ref={ref}
      onClick={copy}
      className="pp-copy"
      data-copied={copied || undefined}
      aria-label={copied ? dictionary.code.copied : dictionary.code.copy}
    >
      {copied ? (
        <svg
          aria-hidden
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M4 12.5l5 5L20 6.5" />
        </svg>
      ) : (
        <svg
          aria-hidden
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <rect x="9" y="9" width="11" height="11" />
          <path d="M15 5H5v10" />
        </svg>
      )}
    </button>
  )
}
