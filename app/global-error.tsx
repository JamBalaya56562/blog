"use client"

import { useEffect } from "react"
import { ThemeInitScript } from "@/components/theme-init-script"
import { fontVars } from "@/lib/fonts"
import { ThemeProvider } from "@/lib/theme/theme-provider"
import "@/app/globals.css"

/**
 * Root error boundary. It REPLACES `app/layout.tsx` and every nested layout,
 * so nothing from `app/[locale]/layout.tsx` is available: this file has to
 * bring its own `<html>`, `<body>`, stylesheet, fonts and theme class, and
 * cannot use `next/link` for navigation — the router tree it would need may be
 * the thing that failed. Plain anchors instead.
 *
 * `metadata` exports do not work in an error boundary, so the tab name comes
 * from a React `<title>`; without it the tab shows the raw URL.
 *
 * Copy is not locale-switched here. The failure can happen before any locale is
 * resolved — `app/[locale]/layout.tsx` reads content for the ticker before it
 * renders anything — so both languages are shown, English first.
 */
export default function GlobalError({
  error,
  retry,
}: Readonly<{ error: Error & { digest?: string }; retry: () => void }>) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html lang="en" suppressHydrationWarning className={fontVars}>
      <head>
        {/* The root layout's `viewport` export is gone with the root layout,
            and Next injects no default here — measured, not assumed. Without
            this the fault page renders at desktop width on a phone. */}
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>500 · SYSTEM FAULT — Jam&apos;s Blog</title>
        <ThemeInitScript />
      </head>
      <body className="bg-background text-foreground antialiased">
        {/*
          Two things set the theme here because this page reaches the reader two
          ways. Server-rendered, `ThemeInitScript` runs while <head> parses and
          the class is on <html> before first paint. Rendered on the client
          instead — which is what happens in development, and after a failure
          past hydration — React never executes that script, and without this
          provider a dark-mode reader gets a white page. Measured: with only the
          script, `prefers-color-scheme: dark` still rendered light.
        */}
        <ThemeProvider>
          <div className="relative flex min-h-screen flex-col overflow-hidden">
            <div aria-hidden className="pp-grid-bg opacity-20" />
            <div aria-hidden className="pp-scan-sweep pp-fault-sweep" />

            <div className="relative z-10 flex items-center justify-between border-b border-cyber-line px-6 py-4 sm:px-8">
              <span className="pp-tick">JAM&apos;S BLOG</span>
              <span className="pp-tick inline-flex items-center gap-2">
                <span aria-hidden className="pp-pulse text-cyber-red">
                  ●
                </span>
                UPLINK DOWN / アップリンク断
              </span>
            </div>

            <div className="relative z-10 flex flex-1 items-center justify-center px-6 py-14 sm:px-8">
              <div className="relative w-full max-w-[720px] border border-cyber-line-hi bg-cyber-bg-1/70 px-8 py-10 sm:px-10">
                <span
                  aria-hidden
                  className="absolute inset-x-0 top-0 h-0.5 bg-cyber-red"
                />
                {/* Braced so the `//` reads as text rather than a comment. */}
                <p className="pp-tick">{"SIBYL // FAULT REPORT"}</p>

                <div className="relative mt-1.5">
                  <span className="pp-500 pp-500-panel pp-500-base">500</span>
                  <span
                    aria-hidden
                    className="pp-500 pp-500-panel pp-500-ghost pp-500-ghost-red"
                  >
                    500
                  </span>
                </div>

                <p className="mt-1.5 font-mono text-xs tracking-[0.24em] text-cyber-red">
                  SYSTEM FAULT / システム障害
                </p>
                <p className="mt-4 font-mono text-[12.5px] leading-[2] tracking-[0.05em] text-cyber-dim">
                  The system failed before the interface could load. Retry, or
                  return to the index.
                  <br />
                  インターフェースの読み込み前にシステムが停止しました。再試行、または索引へ戻ってください。
                </p>

                {error.digest && (
                  <p className="pp-tick mt-5 inline-flex items-center gap-2.5 border border-cyber-line px-3 py-2">
                    <span className="text-cyber-red">TRACE</span>
                    <span className="pp-num">{error.digest}</span>
                  </p>
                )}

                <div className="mt-7 flex flex-wrap gap-3">
                  {/* `retry()` re-fetches; `reset()` would redraw the same
                    failure. See the note in app/[locale]/error.tsx. */}
                  <button
                    type="button"
                    onClick={() => retry()}
                    className="pp-btn pp-btn-amber"
                  >
                    <span aria-hidden>◢</span>
                    <span>RETRY / 再試行</span>
                  </button>
                  {/* proxy.ts redirects a bare `/` to a locale, so this lands
                    somewhere real even with no router. */}
                  <a href="/en" className="pp-btn">
                    <span aria-hidden>◢</span>
                    <span>RETURN TO HOME</span>
                  </a>
                </div>
              </div>
            </div>

            <div className="relative z-10 flex items-center justify-between border-t border-cyber-line px-6 py-3.5 sm:px-8">
              <span className="pp-tick">RELOAD TO RE-ESTABLISH UPLINK</span>
              <span className="pp-tick">ERR 500</span>
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
