"use client"

import type { Route } from "next"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect } from "react"
import { defaultLocale, isValidLocale } from "@/lib/i18n/config"
import { getDictionary } from "@/lib/i18n/get-dictionary"

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
            {error.digest && (
              <p className="pp-tick inline-flex items-center gap-2.5 border border-cyber-line bg-cyber-bg-1/65 px-3 py-2">
                <span className="text-cyber-amber">TRACE</span>
                <span className="pp-num">{error.digest}</span>
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-3">
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
