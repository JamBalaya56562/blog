import { notFound } from "next/navigation"
import { Suspense } from "react"
import { BentoGrid } from "@/components/home/bento-grid"
import { HeroSection } from "@/components/home/hero-section"
import { RecentDispatches } from "@/components/home/recent-dispatches"
import { HomeContentSkeleton } from "@/components/skeletons"
import { createContentLoader } from "@/lib/content/loader"
import { getViewCounts } from "@/lib/db/queries"
import type { Locale } from "@/lib/i18n/config"
import { isValidLocale } from "@/lib/i18n/config"
import { getDictionary } from "@/lib/i18n/get-dictionary"

async function HomeBody({ locale }: { locale: Locale }) {
  "use cache"
  const dictionary = getDictionary(locale)
  const loader = createContentLoader()
  const posts = await loader.getAllPosts(locale)

  const bentoGridPosts = posts.slice(0, 3)
  const recentPosts = posts.slice(3, 8)
  const viewCounts = await getViewCounts(
    [...bentoGridPosts, ...recentPosts].map((p) => p.slug),
  )

  const tagSet = new Set<string>()
  for (const p of posts) {
    for (const t of p.frontmatter.tags) {
      tagSet.add(t)
    }
  }

  return (
    <>
      <HeroSection
        locale={locale}
        dictionary={dictionary}
        postCount={posts.length}
        tagCount={tagSet.size}
        latestDate={posts[0]?.frontmatter.date}
      />
      <BentoGrid
        locale={locale}
        posts={bentoGridPosts}
        viewCounts={viewCounts}
        dictionary={dictionary}
      />
      <RecentDispatches
        locale={locale}
        dictionary={dictionary}
        posts={recentPosts}
        indexOffset={bentoGridPosts.length}
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

  return (
    <div className="relative">
      <Suspense fallback={<HomeContentSkeleton />}>
        <HomeBody locale={locale} />
      </Suspense>
    </div>
  )
}
