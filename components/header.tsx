import { BookOpen, Globe, User } from "lucide-react"
import type { Route } from "next"
import Image from "next/image"
import Link from "next/link"
import { LocaleSwitchLink } from "@/components/locale-switch-link"
import { MarqueeTicker } from "@/components/marquee-ticker"
import { MobileIndex } from "@/components/mobile-index"
import { MobileMenu } from "@/components/mobile-menu"
import { ThemeToggle } from "@/components/theme-toggle"
import type { Locale } from "@/lib/i18n/config"
import { locales } from "@/lib/i18n/config"
import type { Dictionary } from "@/lib/i18n/get-dictionary"

interface HeaderProps {
  readonly locale: Locale
  readonly dictionary: Dictionary
  readonly tickerItems?: readonly string[]
}

export function Header({ locale, dictionary, tickerItems }: HeaderProps) {
  const otherLocale = locales.find((l) => l !== locale) ?? locale

  return (
    <header className="sticky top-0 z-40 border-b border-cyber-line bg-cyber-bg-0/85 backdrop-blur-md">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-7">
        <Link
          href={`/${locale}` as Route}
          transitionTypes={["nav-back"]}
          className="flex shrink-0 items-center gap-3 text-foreground"
          aria-label={dictionary.header.siteName}
        >
          <Image
            src="/logo.svg"
            alt={dictionary.header.siteName}
            width={166}
            height={20}
            priority
          />
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          <NavTab
            href={`/${locale}/blog` as Route}
            label={dictionary.nav.blog}
          />
          <NavTab
            href={`/${locale}/portfolio` as Route}
            label={dictionary.footer.portfolio}
          />
          <span className="mx-2 h-4 w-px bg-cyber-line" />
          <LocaleSwitchLink
            currentLocale={locale}
            targetLocale={otherLocale}
            className="pp-tick px-2 py-1 text-cyber-dim transition-colors hover:text-cyber-cyan"
          >
            {`JA / EN`}
          </LocaleSwitchLink>
          <ThemeToggle dictionary={dictionary} />
          {/* Between md and xl the tabs are back but the floating index is
              not yet, so the index button rides at the end of this cluster.
              It renders nothing off the post page. */}
          <MobileIndex dictionary={dictionary} />
        </div>

        {/* Below md: the index button beside the hamburger. This cluster is
            hidden from md, so it never becomes a third flex item that would
            push the tabs into the middle of the bar. */}
        <div className="flex items-center gap-1 md:hidden">
          <MobileIndex dictionary={dictionary} />
          <div className="flex items-center">
            <MobileMenu dictionary={dictionary}>
              <Link
                href={`/${locale}/blog` as Route}
                className="flex items-center gap-3 rounded px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-cyber-bg-1"
              >
                <BookOpen size={16} className="text-cyber-cyan" />
                {dictionary.nav.blog}
              </Link>
              <Link
                href={`/${locale}/portfolio` as Route}
                className="flex items-center gap-3 rounded px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-cyber-bg-1"
              >
                <User size={16} className="text-cyber-cyan" />
                {dictionary.footer.portfolio}
              </Link>
              <LocaleSwitchLink
                currentLocale={locale}
                targetLocale={otherLocale}
                className="flex items-center gap-3 rounded px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-cyber-bg-1"
              >
                <Globe size={16} className="text-cyber-cyan" />
                {dictionary.language.switchTo}
              </LocaleSwitchLink>
              <div className="border-t border-cyber-line pt-2">
                <ThemeToggle dictionary={dictionary} />
              </div>
            </MobileMenu>
          </div>
        </div>
      </nav>
      {tickerItems && tickerItems.length > 0 && (
        <MarqueeTicker items={tickerItems} />
      )}
    </header>
  )
}

function NavTab({
  href,
  label,
}: {
  readonly href: Route
  readonly label: string
}) {
  return (
    <Link
      href={href}
      className="group relative inline-flex items-center py-2 pr-3 pl-6 font-mono text-[11px] uppercase tracking-[0.2em] text-foreground transition-colors hover:text-cyber-cyan"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute left-0 -translate-x-2 text-cyber-cyan opacity-0 transition-all duration-200 ease-out group-hover:translate-x-1 group-hover:opacity-100"
      >
        ◢
      </span>
      <span className="relative z-10">{label}</span>
      <span
        aria-hidden
        className="pointer-events-none absolute right-3 bottom-1 left-6 h-px origin-left scale-x-0 bg-cyber-cyan transition-transform duration-300 ease-out group-hover:scale-x-100"
      />
    </Link>
  )
}
