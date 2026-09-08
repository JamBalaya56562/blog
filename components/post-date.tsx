import type { Locale } from "@/lib/i18n/config"
import { displayDate, spokenDate } from "@/lib/i18n/format-date"

/**
 * A date shown as `2025.03.01` and announced as "2025年3月1日".
 *
 * Two nodes rather than one attribute, because the attribute-based options do
 * not work: `<time datetime>` is not announced, and `aria-label` is prohibited
 * on the roles these elements have. Changing what a screen reader says means
 * giving it different text — `aria-hidden` takes the dotted form out of the
 * accessibility tree, and the `sr-only` copy takes its place there without
 * appearing on screen.
 *
 * The two are always the same date: both come from the one `date` prop.
 */
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
