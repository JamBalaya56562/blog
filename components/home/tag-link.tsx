"use client"

import { useRouter } from "next/navigation"
import type { Locale } from "@/lib/i18n/config"

interface TagLinkProps {
  readonly tag: string
  readonly locale: Locale
  readonly className?: string
  readonly active?: boolean
}

export function TagLink({
  tag,
  locale,
  className,
  active,
}: Readonly<TagLinkProps>) {
  const router = useRouter()

  return (
    <button
      type="button"
      data-active={active ? "true" : undefined}
      className={`tag-link ${className ?? ""}`}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        router.push(`/${locale}/blog?tag=${encodeURIComponent(tag)}`)
      }}
    >
      {tag}
    </button>
  )
}
