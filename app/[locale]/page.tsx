import { notFound } from "next/navigation"
import { BENTO_GRID_POST_COUNT, BentoGrid } from "@/components/home/bento-grid"
import { HeroSection } from "@/components/home/hero-section"
import { RecentDispatches } from "@/components/home/recent-dispatches"
import { JsonLd } from "@/components/json-ld"
import { PageTransition } from "@/components/page-transition"
import { ViewCountsProvider } from "@/components/view-counts"
import { createContentLoader } from "@/lib/content/loader"
import type { Locale } from "@/lib/i18n/config"
import { isValidLocale } from "@/lib/i18n/config"
import { getDictionary } from "@/lib/i18n/get-dictionary"
import { localePageMetadata } from "@/lib/metadata"
import { websiteJsonLd } from "@/lib/structured-data"

async function HomeBody({ locale }: { locale: Locale }) {
  "use cache"
  const dictionary = getDictionary(locale)
  const loader = createContentLoader()
  const posts = await loader.getAllPosts(locale)

  const bentoGridPosts = posts.slice(0, BENTO_GRID_POST_COUNT)
  const recentPosts = posts.slice(
    BENTO_GRID_POST_COUNT,
    BENTO_GRID_POST_COUNT + 5,
  )

  return (
    <>
      <HeroSection locale={locale} dictionary={dictionary} />
      <ViewCountsProvider slugs={bentoGridPosts.map((p) => p.slug)}>
        <BentoGrid
          locale={locale}
          posts={bentoGridPosts}
          dictionary={dictionary}
        />
      </ViewCountsProvider>
      <RecentDispatches
        locale={locale}
        dictionary={dictionary}
        posts={recentPosts}
        indexOffset={bentoGridPosts.length}
      />
    </>
  )
}

export const generateMetadata = localePageMetadata("", {
  description: (d) => d.home.description,
})

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!isValidLocale(locale)) {
    notFound()
  }

  return (
    <PageTransition>
      <JsonLd data={websiteJsonLd(locale)} />
      <div className="relative">
        <HomeBody locale={locale} />
      </div>
    </PageTransition>
  )
}
