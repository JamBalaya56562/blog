import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { connection } from "next/server"
import { Suspense } from "react"
import { BentoGrid } from "@/components/home/bento-grid"
import { HeroSection } from "@/components/home/hero-section"
import { RecentDispatches } from "@/components/home/recent-dispatches"
import { PageTransition } from "@/components/page-transition"
import { HomeContentSkeleton } from "@/components/skeletons"
import { createContentLoader } from "@/lib/content/loader"
import { getViewCounts } from "@/lib/db/queries"
import type { Locale } from "@/lib/i18n/config"
import { isValidLocale } from "@/lib/i18n/config"
import { getDictionary } from "@/lib/i18n/get-dictionary"
import { localeAlternates } from "@/lib/site"

/**
 * Everything on the home page that is worth caching.
 *
 * The view counts are deliberately not in here. Caching them froze the figures
 * into the cache entry, and on Lambda that entry is the one baked at build time:
 * `isrFlushToDisk` is off, so a revalidated entry lives only in the memory of
 * the instance that produced it, and every cold start falls back to the build
 * output. A build that cannot reach the database therefore served zeroes on
 * every cold start, not just for one revalidation window.
 */
async function getHomeData(locale: Locale) {
  "use cache"
  const loader = createContentLoader()
  const posts = await loader.getAllPosts(locale)

  const tagSet = new Set<string>()
  for (const p of posts) {
    for (const t of p.frontmatter.tags) {
      tagSet.add(t)
    }
  }

  return {
    bentoGridPosts: posts.slice(0, 3),
    latestDate: posts[0]?.frontmatter.date,
    postCount: posts.length,
    recentPosts: posts.slice(3, 8),
    tagCount: tagSet.size,
  }
}

async function HomeBody({ locale }: { locale: Locale }) {
  const dictionary = getDictionary(locale)
  const { bentoGridPosts, latestDate, postCount, recentPosts, tagCount } =
    await getHomeData(locale)

  // Marks everything below as request-time work. Without it the prerender
  // trips over the random request id the AWS SDK generates, which Next rejects
  // as an unstable value in a static render.
  await connection()

  // Read live on every request. One BatchGetItem over at most eight keys, which
  // is a few milliseconds in-region and far inside the free tier.
  const viewCounts = await getViewCounts(
    [...bentoGridPosts, ...recentPosts].map((p) => p.slug),
  )

  return (
    <>
      <HeroSection
        locale={locale}
        dictionary={dictionary}
        postCount={postCount}
        tagCount={tagCount}
        latestDate={latestDate}
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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  if (!isValidLocale(locale)) {
    return {}
  }
  return { alternates: localeAlternates(locale, "") }
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
    <PageTransition>
      <div className="relative">
        <Suspense fallback={<HomeContentSkeleton />}>
          <HomeBody locale={locale} />
        </Suspense>
      </div>
    </PageTransition>
  )
}
