"use client"

import { createContext, useContext, useMemo, useState } from "react"
import type { TocItem } from "@/lib/toc"

export interface TocEntry {
  readonly items: readonly TocItem[]
  readonly title: string
}

interface TocContextValue {
  readonly toc: TocEntry | null
  readonly setToc: (toc: TocEntry | null) => void
}

// The header lives in the layout and the headings live in the post, so the
// post publishes its index here and the header's index button reads it. On
// any page that publishes nothing the button stays out of the header. The
// default is a provider-less no-op, so either side renders on its own.
const TocContext = createContext<TocContextValue>({
  setToc: () => {},
  toc: null,
})

export function TocProvider({ children }: { children: React.ReactNode }) {
  const [toc, setToc] = useState<TocEntry | null>(null)
  const value = useMemo(() => ({ setToc, toc }), [toc])
  return <TocContext.Provider value={value}>{children}</TocContext.Provider>
}

export function useToc(): TocContextValue {
  return useContext(TocContext)
}
