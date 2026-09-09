"use client"

import { useEffect } from "react"
import { ThemeInitScript } from "@/components/theme-init-script"
import { fontVars } from "@/lib/fonts"
import { ThemeProvider } from "@/lib/theme/theme-provider"
import "@/app/globals.css"

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
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>500 · SYSTEM FAULT — Jam&apos;s Blog</title>
        <ThemeInitScript />
      </head>
      <body className="bg-background text-foreground antialiased">
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
                  <button
                    type="button"
                    onClick={() => retry()}
                    className="pp-btn pp-btn-amber"
                  >
                    <span aria-hidden>◢</span>
                    <span>RETRY / 再試行</span>
                  </button>
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
