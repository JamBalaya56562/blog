"use client"

import type { Route } from "next"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useId, useRef, useState } from "react"

interface SearchInputProps {
  readonly placeholder: string
  readonly label: string
  readonly basePath: string
}

export function SearchInput({
  placeholder,
  label,
  basePath,
}: SearchInputProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [value, setValue] = useState(searchParams.get("q") ?? "")
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setValue(searchParams.get("q") ?? "")
  }, [searchParams])

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newValue = e.target.value
    setValue(newValue)

    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }
    timerRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (newValue.trim()) {
        params.set("q", newValue.trim())
      } else {
        params.delete("q")
      }
      params.delete("page")
      const qs = params.toString()
      const href = qs ? `${basePath}?${qs}` : basePath
      router.push(href as Route)
    }, 300)
  }

  const id = useId()

  return (
    <div className="relative w-full">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <span
        aria-hidden
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-cyber-cyan"
      >
        ◢
      </span>
      <input
        id={id}
        type="search"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className="pp-input w-full"
        // Inline padding-left wins over .pp-input's `padding: 10px 14px`
        // (Tailwind's `pl-*` utility lives in @layer utilities and loses to
        // the unlayered .pp-input shorthand). Hardcoding here guarantees
        // the typed text never overlaps the leading ◢ glyph.
        style={{ paddingLeft: "2.25rem" }}
      />
    </div>
  )
}
