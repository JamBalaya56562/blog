import type { Locale } from "@/lib/i18n/config"
import { displayDate, spokenDate } from "@/lib/i18n/format-date"

export function PostDate({
  date,
  locale,
}: Readonly<{ date: string; locale: Locale }>) {
  return (
    <>
      <span aria-hidden="true">{displayDate(date)}</span>
      <span className="sr-only">{spokenDate(locale, date)}</span>
    </>
  )
}
