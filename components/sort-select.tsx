"use client"

import type { Route } from "next"
import { useRouter, useSearchParams } from "next/navigation"
import { useId } from "react"

interface SortSelectProps {
  readonly labels: {
    sortLabel: string
    sortNewest: string
    sortPopular: string
  }
  readonly basePath: string
}

export function SortSelect({ labels, basePath }: SortSelectProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = useId()
  const current = searchParams.get("sort") ?? "newest"

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(searchParams.toString())
    if (e.target.value === "popular") {
      params.set("sort", "popular")
    } else {
      params.delete("sort")
    }
    params.delete("page")
    const qs = params.toString()
    const href = qs ? `${basePath}?${qs}` : basePath
    router.push(href as Route)
  }

  return (
    <div className="flex items-center gap-2">
      <label
        htmlFor={id}
        className="text-sm text-on-surface-variant whitespace-nowrap"
      >
        {labels.sortLabel}
      </label>
      <select
        id={id}
        value={current}
        onChange={handleChange}
        className="rounded-xl border border-outline-variant bg-surface-container-lowest px-3 py-2.5 text-sm text-on-surface transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
      >
        <option value="newest">{labels.sortNewest}</option>
        <option value="popular">{labels.sortPopular}</option>
      </select>
    </div>
  )
}
