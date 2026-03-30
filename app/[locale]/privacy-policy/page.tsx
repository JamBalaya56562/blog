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
    <div>
      <h1 className="mb-6 text-3xl font-bold">
        {dictionary.privacyPolicy.title}
      </h1>
      <div className="prose dark:prose-invert max-w-none">
        <p>{dictionary.privacyPolicy.body}</p>
      </div>
    </div>
  )
}
