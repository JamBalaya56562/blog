import { notFound } from "next/navigation"
import { Suspense } from "react"
import { BentoGrid } from "@/components/home/bento-grid"
import { CodeRain } from "@/components/home/code-rain"
import { HeroSection } from "@/components/home/hero-section"
import { ParticleNetwork } from "@/components/home/particle-network"
import { RecentDispatches } from "@/components/home/recent-dispatches"
import { HomeContentSkeleton } from "@/components/skeletons"
import { createContentLoader } from "@/lib/content/loader"
import { getViewCounts } from "@/lib/db/queries"
import type { Locale } from "@/lib/i18n/config"
import { isValidLocale } from "@/lib/i18n/config"
import { getDictionary } from "@/lib/i18n/get-dictionary"

async function HomeContent({ locale }: { locale: Locale }) {
  "use cache"
  const dictionary = getDictionary(locale)
  const loader = createContentLoader()
  const posts = await loader.getAllPosts(locale)

  const bentoGridPosts = posts.slice(0, 3)
  const recentPosts = posts.slice(3, 8)
  const viewCounts = await getViewCounts(bentoGridPosts.map((p) => p.slug))

  return (
    <>
      <div className="py-20">
        <BentoGrid
          locale={locale}
          posts={bentoGridPosts}
          viewCounts={viewCounts}
        />
      </div>
      <RecentDispatches
        locale={locale}
        dictionary={dictionary}
        posts={recentPosts}
      />
    </>
  )
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!isValidLocale(locale)) {
    notFound()
  }

  const dictionary = getDictionary(locale)

  return (
    <div className="relative">
      <ParticleNetwork />
      <CodeRain />
      <HeroSection locale={locale} dictionary={dictionary} />
      <Suspense fallback={<HomeContentSkeleton />}>
        <HomeContent locale={locale} />
      </Suspense>
    </div>
  )
}
