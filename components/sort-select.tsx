"use client"

import type { Route } from "next"
import { useRouter, useSearchParams } from "next/navigation"

interface SortSelectProps {
  readonly labels: {
    sortLabel: string
    sortNewest: string
    sortPopular: string
  }
  readonly basePath: string
}

/**
 * Tab-style sort switch (newest / most-viewed) — replaces the old <select>.
 */
export function SortSelect({ labels, basePath }: SortSelectProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sortParam = searchParams.get("sort")
  const current = sortParam === "popular" ? "popular" : "newest"

  function setSort(next: "newest" | "popular") {
    const params = new URLSearchParams(searchParams.toString())
    if (next === "popular") {
      params.set("sort", "popular")
    } else {
      params.delete("sort")
    }
    params.delete("page")
    const qs = params.toString()
    const href = qs ? `${basePath}?${qs}` : basePath
    router.push(href as Route)
  }

  const options: Array<{ value: "newest" | "popular"; label: string }> = [
    { value: "newest", label: labels.sortNewest },
    { value: "popular", label: labels.sortPopular },
  ]

  return (
    <fieldset className="flex border border-cyber-line">
      <legend className="sr-only">{labels.sortLabel}</legend>
      {options.map((opt, i) => {
        const active = opt.value === current
        return (
          <button
            type="button"
            key={opt.value}
            onClick={() => setSort(opt.value)}
            aria-pressed={active}
            className={`px-4 py-2 font-mono text-[10px] uppercase tracking-[0.18em] transition-colors ${
              i > 0 ? "border-l border-cyber-line" : ""
            } ${
              active
                ? "bg-cyber-cyan text-cyber-bg-0"
                : "text-cyber-dim hover:text-cyber-cyan"
            }`}
          >
            {opt.label}
          </button>
        )
      })}
    </fieldset>
  )
}
