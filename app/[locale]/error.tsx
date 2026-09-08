"use client"

import type { Route } from "next"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect } from "react"
import { defaultLocale, isValidLocale } from "@/lib/i18n/config"
import { getDictionary } from "@/lib/i18n/get-dictionary"

/**
 * Route-level error boundary. Rendered inside `app/[locale]/layout.tsx`, so the
 * header, footer, fonts, theme and `CyberBackground` still come from the layout
 * — this file only owns the fault report.
 *
 * It does not cover that layout: an error boundary never wraps the layout of
 * its own segment. `app/global-error.tsx` is what catches those.
 *
 * Cyan is the site's "route" colour (see the 404); a fault is amber + red so
 * the two screens are not mistaken for each other.
 *
 * The locale comes from the pathname because, like `not-found.tsx`, this file
 * receives no `params`.
 */
export default function LocaleError({
  error,
  retry,
}: Readonly<{ error: Error & { digest?: string }; retry: () => void }>) {
  const pathname = usePathname()
  const segment = pathname?.split("/")[1] ?? ""
  const locale = isValidLocale(segment) ? segment : defaultLocale
  const dictionary = getDictionary(locale)
  const copy = dictionary.error

  useEffect(() => {
    // The boundary swallows the error; without this it never reaches the
    // browser console or any client-side reporter.
    console.error(error)
  }, [error])

  return (
    <section className="relative overflow-hidden px-4 py-16 sm:px-7 sm:py-24">
      <div aria-hidden className="pp-scan-sweep pp-fault-sweep" />

      <div className="relative z-10 mx-auto max-w-7xl">
        <div className="pp-tick flex items-center justify-between">
          <span>{copy.tick}</span>
          <span className="inline-flex items-center gap-2">
            <span aria-hidden className="pp-pulse text-cyber-red">
              ●
            </span>
            {copy.fault}
          </span>
        </div>

        <div className="relative mt-2">
          <span className="pp-500 pp-500-base">500</span>
          <span aria-hidden className="pp-500 pp-500-ghost pp-500-ghost-amber">
            500
          </span>
          <span aria-hidden className="pp-500 pp-500-ghost pp-500-ghost-red">
            500
          </span>
        </div>

        <div className="mt-6 grid gap-7 border-t border-cyber-line pt-7 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <div className="flex min-w-0 flex-col items-start gap-4">
            <p className="max-w-[560px] font-mono text-[12.5px] leading-[2] tracking-[0.05em] text-cyber-dim">
              {copy.description}
            </p>
            {/* Only ever populated in a production build, and it is the one
                thing that ties what the reader saw to a line in the Lambda
                logs. */}
            {error.digest && (
              <p className="pp-tick inline-flex items-center gap-2.5 border border-cyber-line bg-cyber-bg-1/65 px-3 py-2">
                <span className="text-cyber-amber">TRACE</span>
                <span className="pp-num">{error.digest}</span>
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-3">
            {/*
              `retry()`, not `reset()`. The faults worth offering a button for
              are the transient ones — a database timeout, a content read that
              lost its connection — and only `retry` re-fetches the segment.
              `reset` re-renders the same failed result, so the button would
              look broken in exactly the case it exists for.
            */}
            <button
              type="button"
              onClick={() => retry()}
              className="pp-btn pp-btn-amber"
            >
              <span aria-hidden>◢</span>
              <span>{copy.retry}</span>
            </button>
            <Link
              href={`/${locale}` as Route}
              transitionTypes={["nav-back"]}
              className="pp-btn"
            >
              <span aria-hidden>◢</span>
              <span>{copy.home}</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
