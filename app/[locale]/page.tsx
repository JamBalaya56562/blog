import { notFound } from "next/navigation"
import { BentoGrid } from "@/components/home/bento-grid"
import { CodeRain } from "@/components/home/code-rain"
import { HeroSection } from "@/components/home/hero-section"
import { ParticleNetwork } from "@/components/home/particle-network"
import { RecentDispatches } from "@/components/home/recent-dispatches"
import { createContentLoader } from "@/lib/content/loader"
import { isValidLocale } from "@/lib/i18n/config"
import { getDictionary } from "@/lib/i18n/get-dictionary"

export default async function HomePage({
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
  const loader = createContentLoader()
  const posts = await loader.getAllPosts(locale)

  const bentoGridPosts = posts.slice(0, 3)
  const recentPosts = posts.slice(3, 8)

  return (
    <div className="relative">
      <ParticleNetwork />
      <CodeRain />
      <HeroSection locale={locale} dictionary={dictionary} />
      <div className="py-20">
        <BentoGrid locale={locale} posts={bentoGridPosts} />
      </div>
      <RecentDispatches
        locale={locale}
        dictionary={dictionary}
        posts={recentPosts}
      />
    </div>
  )
}
