import type { Locale } from "@/lib/i18n/config"
import type { Dictionary } from "@/lib/i18n/get-dictionary"

export function Footer({
  locale,
  dictionary,
}: Readonly<{ locale: Locale; dictionary: Dictionary }>) {
  return (
    <footer className="border-t border-gray-200 dark:border-gray-800">
      <div className="mx-auto max-w-3xl px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
        <div className="mb-2">
          <a href={`/${locale}/privacy-policy`} className="hover:underline">
            {dictionary.footer.privacyPolicy}
          </a>
        </div>
        {dictionary.footer.copyright.replace(
          "{year}",
          String(new Date().getFullYear()),
        )}
      </div>
    </footer>
  )
}
