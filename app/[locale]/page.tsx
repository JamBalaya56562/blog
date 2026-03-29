import { locales } from "@/lib/i18n/config"

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export default function LocaleHomePage() {
  return (
    <main>
      <h1>Welcome</h1>
      <p>Blog coming soon.</p>
    </main>
  )
}
