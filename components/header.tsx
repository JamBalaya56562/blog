import { BookOpen, Globe, User } from "lucide-react"
import type { Route } from "next"
import Image from "next/image"
import Link from "next/link"
import { LocaleSwitchLink } from "@/components/locale-switch-link"
import { MobileMenu } from "@/components/mobile-menu"
import { ThemeToggle } from "@/components/theme-toggle"
import type { Locale } from "@/lib/i18n/config"
import { locales } from "@/lib/i18n/config"
import type { Dictionary } from "@/lib/i18n/get-dictionary"

export function Header({
  locale,
  dictionary,
}: Readonly<{ locale: Locale; dictionary: Dictionary }>) {
  const otherLocale = locales.find((l) => l !== locale) ?? locale

  return (
    <header className="relative border-b border-gray-200 dark:border-gray-800">
      <nav className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 font-headline">
        <Link
          href={`/${locale}` as Route}
          className="text-lg font-bold text-foreground"
        >
          <Image
            src="/logo.svg"
            alt={dictionary.header.siteName}
            width={166}
            height={20}
            priority
          />
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-4 md:flex">
          <Link
            href={`/${locale}/blog` as Route}
            className="text-foreground hover:underline"
          >
            {dictionary.nav.blog}
          </Link>
          <Link
            href={`/${locale}/portfolio` as Route}
            className="text-foreground hover:underline"
          >
            {dictionary.footer.portfolio}
          </Link>
          <LocaleSwitchLink
            currentLocale={locale}
            targetLocale={otherLocale}
            className="rounded px-2 py-1 text-sm text-foreground hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            {dictionary.language.switchTo}
          </LocaleSwitchLink>
          <ThemeToggle dictionary={dictionary} />
        </div>

        {/* Mobile nav */}
        <div className="flex items-center md:hidden">
          <MobileMenu>
            <Link
              href={`/${locale}/blog` as Route}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-container-low"
            >
              <BookOpen size={16} className="text-on-surface-variant" />
              {dictionary.nav.blog}
            </Link>
            <Link
              href={`/${locale}/portfolio` as Route}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-container-low"
            >
              <User size={16} className="text-on-surface-variant" />
              {dictionary.footer.portfolio}
            </Link>
            <LocaleSwitchLink
              currentLocale={locale}
              targetLocale={otherLocale}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-container-low"
            >
              <Globe size={16} className="text-on-surface-variant" />
              {dictionary.language.switchTo}
            </LocaleSwitchLink>
            <div className="border-t border-outline-variant/15 pt-2">
              <ThemeToggle dictionary={dictionary} />
            </div>
          </MobileMenu>
        </div>
      </nav>
    </header>
  )
}
