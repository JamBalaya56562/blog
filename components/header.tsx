import type { Route } from "next"
import Link from "next/link"
import { LocaleSwitchLink } from "@/components/locale-switch-link"
import type { Locale } from "@/lib/i18n/config"
import { locales } from "@/lib/i18n/config"
import type { Dictionary } from "@/lib/i18n/get-dictionary"

export function Header({
  locale,
  dictionary,
}: Readonly<{ locale: Locale; dictionary: Dictionary }>) {
  const otherLocale = locales.find((l) => l !== locale) ?? locale

  return (
    <header className="border-b border-gray-200 dark:border-gray-800">
      <nav className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
        <Link
          href={`/${locale}` as Route}
          className="text-lg font-bold text-foreground"
        >
          {dictionary.header.siteName}
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href={`/${locale}` as Route}
            className="text-foreground hover:underline"
          >
            {dictionary.nav.home}
          </Link>
          <Link
            href={`/${locale}/blog` as Route}
            className="text-foreground hover:underline"
          >
            {dictionary.nav.blog}
          </Link>
          <LocaleSwitchLink
            currentLocale={locale}
            targetLocale={otherLocale}
            className="rounded border border-gray-300 px-2 py-1 text-sm text-foreground hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-800"
          >
            {dictionary.language.switchTo}
          </LocaleSwitchLink>
        </div>
      </nav>
    </header>
  )
}
