"use client"

import type { Route } from "next"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useId, useRef, useState, useTransition } from "react"

interface SearchInputProps {
  readonly placeholder: string
  readonly label: string
  readonly searchingLabel: string
  readonly basePath: string
}

const DEBOUNCE_MS = 300

export function SearchInput({
  placeholder,
  label,
  searchingLabel,
  basePath,
}: SearchInputProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const urlQuery = searchParams.get("q") ?? ""
  const [value, setValue] = useState(urlQuery)
  const [isPending, startTransition] = useTransition()
  // The query this input last sent to the router. A URL that matches it is
  // this input's own navigation landing; one that does not is the back
  // button, a tag chip or a fresh page, and only those may replace what the
  // reader has typed.
  const [sent, setSent] = useState(urlQuery)
  // The URL as last seen here. Only a URL that has actually moved is a
  // navigation landing; `sent` running ahead of an unchanged URL is just the
  // debounce having fired.
  const seenUrlRef = useRef(urlQuery)
  // The URL's parameters as of the latest render, for the debounce callback
  // to build on. The callback's own closure holds the parameters from the
  // keystroke that armed it, and a sort or tag navigation can land in the
  // 300ms in between; building from that snapshot would push those away.
  const paramsRef = useRef(searchParams)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const composingRef = useRef(false)

  useEffect(() => {
    paramsRef.current = searchParams
  }, [searchParams])

  useEffect(() => {
    if (urlQuery === seenUrlRef.current) {
      return
    }
    // A navigation still in flight brings a URL that is already behind the
    // input — the reader kept typing after it was sent — so adopting it
    // would throw those keystrokes away. It is looked at again once the
    // flight is over.
    if (isPending) {
      return
    }
    seenUrlRef.current = urlQuery
    if (urlQuery === sent) {
      return
    }
    // Something else set the query. A draft still waiting on the debounce
    // would send the reader's old text over it, so the draft is dropped.
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    setSent(urlQuery)
    setValue(urlQuery)
  }, [urlQuery, isPending, sent])

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [])

  function schedule(raw: string) {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }
    timerRef.current = setTimeout(() => {
      timerRef.current = null
      const query = raw.trim()
      if (query === sent) {
        return
      }
      setSent(query)
      const params = new URLSearchParams(paramsRef.current.toString())
      if (query) {
        params.set("q", query)
      } else {
        params.delete("q")
      }
      params.delete("page")
      const qs = params.toString()
      const href = qs ? `${basePath}?${qs}` : basePath
      startTransition(() => {
        router.push(href as Route)
      })
    }, DEBOUNCE_MS)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setValue(e.target.value)
    // Mid-composition text is not a query yet: with an IME the reader is
    // still choosing the characters, and a navigation landing in the middle
    // of that breaks the composition.
    if (!composingRef.current) {
      schedule(e.target.value)
    }
  }

  function handleCompositionStart() {
    composingRef.current = true
  }

  function handleCompositionEnd(e: React.CompositionEvent<HTMLInputElement>) {
    composingRef.current = false
    schedule(e.currentTarget.value)
  }

  // Searching from the reader's point of view: the input has moved away from
  // what the page shows, whether the debounce is still counting down or the
  // navigation is on its way.
  const searching = isPending || value.trim() !== sent

  const id = useId()
  const statusId = useId()

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
        onCompositionStart={handleCompositionStart}
        onCompositionEnd={handleCompositionEnd}
        placeholder={placeholder}
        aria-describedby={statusId}
        className="pp-input w-full pl-9 pr-28"
      />
      <span
        id={statusId}
        role="status"
        aria-live="polite"
        data-searching={searching || undefined}
        className="pp-search-status"
      >
        {searching ? searchingLabel : ""}
      </span>
    </div>
  )
}
