import type { Dictionary } from "@/lib/i18n/get-dictionary"

export function Footer({ dictionary }: Readonly<{ dictionary: Dictionary }>) {
  return (
    <footer className="border-t border-gray-200 dark:border-gray-800">
      <div className="mx-auto max-w-3xl px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
        {dictionary.footer.copyright.replace(
          "{year}",
          String(new Date().getFullYear()),
        )}
      </div>
    </footer>
  )
}
