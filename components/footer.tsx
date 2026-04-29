import type { Route } from "next"
import Image from "next/image"
import Link from "next/link"
import type { Locale } from "@/lib/i18n/config"
import type { Dictionary } from "@/lib/i18n/get-dictionary"

const GITHUB_REPO_URL = "https://github.com/JamBalaya56562/blog"

export function Footer({
  locale,
  dictionary,
}: Readonly<{ locale: Locale; dictionary: Dictionary }>) {
  return (
    <footer className="relative z-10 mt-20 border-t border-cyber-line bg-cyber-bg-1/40 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-4 px-7 py-6">
        <Link
          href={`/${locale}` as Route}
          className="flex shrink-0 items-center gap-2"
          aria-label={dictionary.header.siteName}
        >
          <Image
            src="/logo.svg"
            alt={dictionary.header.siteName}
            width={140}
            height={18}
          />
        </Link>

        <span className="h-px flex-1 bg-cyber-line" />

        <div className="flex flex-wrap items-center gap-4">
          <Link
            href={`/${locale}/blog` as Route}
            className="pp-tick pp-link transition-colors hover:text-cyber-cyan"
          >
            {dictionary.nav.blog}
          </Link>
          <Link
            href={`/${locale}/portfolio` as Route}
            className="pp-tick pp-link transition-colors hover:text-cyber-cyan"
          >
            {dictionary.footer.portfolio}
          </Link>
          <Link
            href={`/${locale}/privacy-policy` as Route}
            className="pp-tick pp-link transition-colors hover:text-cyber-cyan"
          >
            {dictionary.footer.privacyPolicy}
          </Link>
          <a
            href={GITHUB_REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
            className="opacity-70 transition-opacity hover:opacity-100"
          >
            <Image
              src="/github-mark.svg"
              alt="GitHub"
              width={18}
              height={18}
              className="block dark:hidden"
            />
            <Image
              src="/github-mark-white.svg"
              alt="GitHub"
              width={18}
              height={18}
              className="hidden dark:block"
            />
          </a>
        </div>
      </div>

      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 border-t border-cyber-line/60 px-7 py-3">
        <span className="pp-tick">
          {/* The dictionary value already starts with "©" — no need to
              prefix another one here. */}
          {dictionary.footer.copyright.replace(
            "{year}",
            String(new Date().getFullYear()),
          )}
        </span>
        <span className="pp-tick">
          <span className="mr-1.5 text-cyber-lime">●</span>
          {dictionary.footer.systemsNominal}
        </span>
      </div>
    </footer>
  )
}
