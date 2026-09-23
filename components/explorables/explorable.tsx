"use client"

import { usePathname } from "next/navigation"
import { useRef } from "react"
import { isValidLocale } from "@/lib/i18n/config"
import { getDictionary } from "@/lib/i18n/get-dictionary"
import { Frame } from "./frame"

type Props = Readonly<{
  /** What the figure is about, in the strip: "Dockerfile", "commitlint". */
  title: string
  /** One line telling the reader what to touch. */
  hint?: string
  /** One sentence describing the current state; read out when it changes. */
  status: string
  /**
   * Every sentence this figure can say, so the line keeps the height of the
   * longest of them. A figure whose sentences are all one line needs none of
   * this; one whose sentences wrap differently moves the page without it.
   */
  statuses?: readonly string[]
  /** The takeaway, under the figure — what the old alt text used to say. */
  caption?: string
  /** True while the figure is in the state it was served with. */
  pristine: boolean
  onReset: () => void
  children: React.ReactNode
}>

/**
 * The frame around a figure the reader can touch.
 *
 * Each figure is a small model of something the article explains — a build
 * cache, a commit graph — with a few buttons that change it. This frame gives
 * them one look, the strip of the code panels, and the three things every one
 * of them needs: a heading, a line of status that a screen reader hears when
 * the state changes, and a way back to the start.
 *
 * Everything written here is the article's: the title, the hint, the status
 * sentence and the caption arrive as props from the MDX, in the post's own
 * language. The two labels of the frame's own — the word in the strip that
 * says what kind of panel this is, and the reset button — come from the
 * dictionary for the locale in the URL, the way the copy button and the
 * lightbox find theirs: the MDX component map has no locale to pass down.
 *
 * Resetting disables the button, which drops focus; it is moved to the figure
 * itself so a keyboard user is left where they were rather than at the top of
 * the page.
 */
export function Explorable({
  title,
  hint,
  status,
  statuses,
  caption,
  pristine,
  onReset,
  children,
}: Props) {
  const figure = useRef<HTMLElement>(null)
  const pathname = usePathname()
  const segment = pathname.split("/")[1] ?? ""
  const dictionary = getDictionary(isValidLocale(segment) ? segment : "en")

  function reset() {
    onReset()
    figure.current?.focus()
  }

  return (
    <figure
      aria-label={title}
      className="pp-explorable"
      ref={figure}
      tabIndex={-1}
    >
      <div className="pp-explorable-head">
        <span className="pp-explorable-name">{title}</span>
        <span className="pp-explorable-kind">{dictionary.explorable.kind}</span>
        <button
          aria-label={dictionary.explorable.reset}
          className="pp-explorable-reset"
          disabled={pristine}
          onClick={reset}
          title={dictionary.explorable.reset}
          type="button"
        >
          <svg
            aria-hidden="true"
            fill="none"
            height="14"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            width="14"
          >
            <path d="M3 12a9 9 0 1 0 3-6.7" />
            <path d="M3 4v5h5" />
          </svg>
        </button>
      </div>
      {hint && <p className="pp-explorable-hint">{hint}</p>}
      <div className="pp-explorable-body">{children}</div>
      {statuses === undefined ? (
        <p
          aria-atomic="true"
          aria-live="polite"
          className="pp-explorable-status"
        >
          {status}
        </p>
      ) : (
        <Frame
          active={0}
          panes={[
            <p
              aria-atomic="true"
              aria-live="polite"
              className="pp-explorable-status"
              key="live"
            >
              {status}
            </p>,
            ...statuses
              .filter((sentence) => sentence !== status)
              .map((sentence) => (
                <p className="pp-explorable-status" key={sentence}>
                  {sentence}
                </p>
              )),
          ]}
        />
      )}
      {caption && (
        <figcaption className="pp-explorable-caption">{caption}</figcaption>
      )}
    </figure>
  )
}
