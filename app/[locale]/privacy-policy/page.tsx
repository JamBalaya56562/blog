import { notFound } from "next/navigation"
import { isValidLocale } from "@/lib/i18n/config"
import { getDictionary } from "@/lib/i18n/get-dictionary"

export default async function PrivacyPolicyPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  "use cache"
  const { locale } = await params
  if (!isValidLocale(locale)) {
    notFound()
  }

  const dictionary = getDictionary(locale)

  return (
    <div className="mx-auto max-w-3xl px-7 py-12">
      <h1 className="pp-display text-4xl text-foreground sm:text-5xl">
        {dictionary.privacyPolicy.title}
        <span className="text-cyber-cyan">.</span>
      </h1>
      <div className="prose-cyber mt-10">
        <p>{dictionary.privacyPolicy.body}</p>
      </div>
    </div>
  )
}
