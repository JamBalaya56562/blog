"use client"

import { usePathname } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { isValidLocale } from "@/lib/i18n/config"
import { getDictionary } from "@/lib/i18n/get-dictionary"

type Props = React.ImgHTMLAttributes<HTMLImageElement> & {
  src: string
  alt: string
}

/**
 * An image in a post that opens at full size when clicked.
 *
 * The pictures in the posts are screenshots and diagrams drawn at two or three
 * times the width of the article, so at the article's width their text is a
 * texture. The picture sits in a button; the button opens a native `<dialog>`
 * with the same source at up to the viewport's size. `showModal()` gives the
 * backdrop, closes on Escape and keeps focus inside, so none of that is
 * written here. A click on the backdrop or the close button closes it; a tap
 * on the picture itself does not, so pinch-zooming on a phone does not shut
 * the dialog under the reader's fingers.
 *
 * The dialog exists only while it is open, and it is rendered into `body`
 * through a portal. Markdown puts an image inside a paragraph, and a
 * `<dialog>` is not allowed inside a `<p>`: the HTML parser closes the
 * paragraph in front of it and hydration then fails. Creating it on the click
 * also means the full-size copy of the picture is not fetched until someone
 * asks for it. Closing is one state change — unmounting the dialog closes
 * it — and `onClose` covers Escape, which the element handles itself.
 *
 * Labels come from the dictionary for the locale in the URL, the same way the
 * copy button finds its own: the MDX component map has no locale to pass down.
 */
export function ZoomableImage({ src, alt, className, ...props }: Props) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const segment = pathname.split("/")[1] ?? ""
  const dictionary = getDictionary(isValidLocale(segment) ? segment : "en")

  // The dialog mounts on the click; it can only be shown once it is in the
  // DOM, so the call waits for the render that put it there.
  useEffect(() => {
    if (open) {
      dialog.current?.showModal()
    }
  }, [open])

  return (
    <>
      <button
        type="button"
        className="pp-zoom my-4 block max-w-full"
        title={dictionary.image.zoom}
        onClick={() => setOpen(true)}
      >
        {/* biome-ignore lint/performance/noImgElement: MDX images have unknown intrinsic dimensions and `images.unoptimized` is enabled, so next/image adds no benefit here */}
        <img
          src={src}
          alt={alt}
          className={className}
          loading="lazy"
          decoding="async"
          {...props}
        />
      </button>
      {open &&
        createPortal(
          // biome-ignore lint/a11y/useKeyWithClickEvents: the click here is the backdrop; the keyboard path is Escape, which <dialog> handles itself
          <dialog
            ref={dialog}
            className="pp-lightbox"
            aria-label={alt}
            onClose={() => setOpen(false)}
            onClick={(event) => {
              if (event.target === event.currentTarget) {
                setOpen(false)
              }
            }}
          >
            {/* biome-ignore lint/performance/noImgElement: same source as above, shown at full size */}
            <img
              src={src}
              alt={alt}
              className="pp-lightbox-img"
              decoding="async"
            />
            <button
              type="button"
              className="pp-lightbox-close"
              aria-label={dictionary.image.close}
              onClick={() => setOpen(false)}
            >
              <svg
                aria-hidden
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M5 5l14 14M19 5L5 19" />
              </svg>
            </button>
          </dialog>,
          document.body,
        )}
    </>
  )
}
