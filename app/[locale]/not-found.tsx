"use client"

import type { Route } from "next"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { defaultLocale, isValidLocale } from "@/lib/i18n/config"
import { getDictionary } from "@/lib/i18n/get-dictionary"

export default function NotFound() {
  const pathname = usePathname()
  const segment = pathname?.split("/")[1] ?? ""
  const locale = isValidLocale(segment) ? segment : defaultLocale
  const dictionary = getDictionary(locale)
  const notFound = dictionary.notFound

  return (
    <section className="relative overflow-hidden px-4 py-16 sm:px-7 sm:py-24">
      <div aria-hidden className="pp-scan-sweep pp-404-sweep" />

      <div className="relative z-10 mx-auto max-w-7xl">
        <div className="pp-tick flex items-center justify-between">
          <span>ROUTE 404</span>
          <span>{notFound.signalLost}</span>
        </div>

        <div className="relative mt-2">
          <span className="pp-404 pp-404-base">404</span>
          <span aria-hidden className="pp-404 pp-404-ghost pp-404-ghost-cyan">
            404
          </span>
          <span aria-hidden className="pp-404 pp-404-ghost pp-404-ghost-red">
            404
          </span>
        </div>

        <div className="mt-6 grid gap-7 border-t border-cyber-line pt-7 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <p className="max-w-[520px] font-mono text-[12.5px] leading-[2] tracking-[0.05em] text-cyber-dim">
            {notFound.description}
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/${locale}` as Route}
              transitionTypes={["nav-back"]}
              className="pp-btn"
            >
              <span aria-hidden>◢</span>
              <span>{notFound.home}</span>
            </Link>
            <Link
              href={`/${locale}/blog` as Route}
              className="pp-btn pp-btn-amber"
            >
              <span aria-hidden>◢</span>
              <span>{dictionary.nav.blog}</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
