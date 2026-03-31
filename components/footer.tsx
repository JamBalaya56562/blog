import type { Route } from "next"
import Link from "next/link"
import type { Locale } from "@/lib/i18n/config"
import type { Dictionary } from "@/lib/i18n/get-dictionary"

export function Footer({
  locale,
  dictionary,
}: Readonly<{ locale: Locale; dictionary: Dictionary }>) {
  return (
    <footer className="border-t border-gray-200 dark:border-gray-800">
      <div className="mx-auto max-w-3xl px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
        <div className="mb-2 flex justify-center gap-4">
          <Link
            href={`/${locale}/portfolio` as Route}
            className="hover:underline"
          >
            {dictionary.footer.portfolio}
          </Link>
          <Link
            href={`/${locale}/privacy-policy` as Route}
            className="hover:underline"
          >
            {dictionary.footer.privacyPolicy}
          </Link>
        </div>
        {dictionary.footer.copyright.replace(
          "{year}",
          String(new Date().getFullYear()),
        )}
      </div>
    </footer>
  )
}
