import type { Metadata, Route } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { MDXRemote } from "next-mdx-remote-client/rsc"
import { cache, Suspense, ViewTransition } from "react"
import remarkGfm from "remark-gfm"
import {
  DEFAULT_THUMBNAIL,
  estimateReadingTime,
} from "@/components/article-card"
import { PostNavigation } from "@/components/post-navigation"
import { getRelatedPosts, RelatedPosts } from "@/components/related-posts"
import { ScrollProgress } from "@/components/scroll-progress"
import { BlogPostSkeleton } from "@/components/skeletons"
import { TableOfContents } from "@/components/table-of-contents"
import { Brackets } from "@/components/ui/brackets"
import { ViewCounter } from "@/components/view-counter"
import { findAdjacentPosts } from "@/lib/content/adjacent"
import { createContentLoader } from "@/lib/content/loader"
import { getViewCount, getViewCounts } from "@/lib/db/queries"
import type { Locale } from "@/lib/i18n/config"
import { isValidLocale, locales } from "@/lib/i18n/config"
import { getDictionary } from "@/lib/i18n/get-dictionary"
import { getBlogPostPath } from "@/lib/routes"
import { extractToc } from "@/lib/toc"
import { useMDXComponents } from "@/mdx-components"

type Params = { locale: string; slug: string }

const getPost = cache(async (locale: Locale, slug: string) => {
  "use cache"
  const loader = createContentLoader()
  return loader.getPost(locale, slug)
})

export async function generateStaticParams() {
  const loader = createContentLoader()
  const params: Params[] = []
  for (const locale of locales) {
    const slugs = await loader.getPostSlugs(locale)
    for (const slug of slugs) {
      params.push({ locale, slug })
    }
  }
  return params
}

async function getTranslationPair(
  currentLocale: Locale,
  slug: string,
): Promise<Locale | null> {
  for (const locale of locales) {
    if (locale === currentLocale) {
      continue
    }
    const post = await getPost(locale, slug)
    if (post) {
      return locale
    }
  }
  return null
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>
}): Promise<Metadata> {
  const { locale, slug } = await params
  if (!isValidLocale(locale)) {
    return {}
  }
  const post = await getPost(locale, slug)
  if (!post) {
    return {}
  }
  return {
    title: post.frontmatter.title,
    description: post.frontmatter.description,
    openGraph: {
      title: post.frontmatter.title,
      description: post.frontmatter.description,
      images: [post.frontmatter.image ?? DEFAULT_THUMBNAIL],
    },
  }
}

async function BlogPostContent({
  locale,
  slug,
}: {
  locale: Locale
  slug: string
}) {
  "use cache"
  const post = await getPost(locale, slug)
  if (!post) {
    notFound()
  }

  const dictionary = getDictionary(locale)
  const [translationLocale, tocItems, allPosts, viewCount] = await Promise.all([
    getTranslationPair(locale, slug),
    Promise.resolve(extractToc(post.content)),
    createContentLoader().getAllPosts(locale),
    getViewCount(slug),
  ])
  const adjacentPosts = findAdjacentPosts(allPosts, slug)
  const related = getRelatedPosts(allPosts, slug)
  const relatedViewCounts = await getViewCounts(related.map((p) => p.slug))
  const readMin = estimateReadingTime(post.content)
  const category = post.frontmatter.tags[0]?.toUpperCase() ?? "DISPATCH"

  return (
    <>
      <ScrollProgress />
      <TableOfContents items={tocItems} title={dictionary.blog.toc} />
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <article>
          <header className="mb-10">
            <div className="pp-tick mb-3">◢ DISPATCH / {category}</div>
            <ViewTransition name={`post-title-${slug}`} share="morph">
              <h1 className="pp-display text-[clamp(28px,5vw,52px)] leading-[1.1] tracking-tight text-foreground">
                {post.frontmatter.title}
              </h1>
            </ViewTransition>
            <ViewTransition name={`post-meta-${slug}`} share="morph">
              <div className="pp-tick mt-5 flex flex-wrap items-center gap-3">
                <span>
                  {dictionary.blog.postedOn}{" "}
                  {post.frontmatter.date.replace(/-/g, ".")}
                </span>
                <span className="text-cyber-line-hi">·</span>
                <span>
                  <span className="pp-num text-cyber-cyan">{readMin}</span>{" "}
                  {dictionary.blog.minRead}
                </span>
                <span className="text-cyber-line-hi">·</span>
                <ViewCounter slug={slug} count={viewCount} />
              </div>
            </ViewTransition>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {post.frontmatter.tags.map((tag) => (
                <Link
                  key={tag}
                  href={
                    `/${locale}/blog?tag=${encodeURIComponent(tag)}` as Route
                  }
                  className="pp-tag"
                >
                  {tag}
                </Link>
              ))}
            </div>
            {translationLocale && (
              <p className="pp-tick mt-4">
                ◢ {dictionary.blog.translationAvailable}{" "}
                <Link
                  href={getBlogPostPath(translationLocale, slug)}
                  className="pp-link text-cyber-cyan transition-colors hover:text-cyber-cyan-bright"
                >
                  {getDictionary(translationLocale).language.current}
                </Link>
              </p>
            )}
          </header>

          <ViewTransition name={`post-image-${slug}`} share="morph">
            <div className="relative mb-12 aspect-[21/9] overflow-hidden border border-cyber-line">
              <Brackets />
              <Image
                src={post.frontmatter.image ?? DEFAULT_THUMBNAIL}
                alt={post.frontmatter.title}
                width={1200}
                height={514}
                className="h-full w-full object-cover"
              />
            </div>
          </ViewTransition>

          <div className="prose-cyber max-w-none">
            <MDXRemote
              source={post.content}
              options={{ mdxOptions: { remarkPlugins: [remarkGfm] } }}
              components={useMDXComponents()}
            />
          </div>
        </article>

        <RelatedPosts
          locale={locale}
          posts={related}
          dictionary={dictionary}
          viewCounts={relatedViewCounts}
        />
        <PostNavigation
          locale={locale}
          adjacentPosts={adjacentPosts}
          dictionary={dictionary}
        />
      </div>
    </>
  )
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<Params>
}) {
  const { locale, slug } = await params
  if (!isValidLocale(locale)) {
    notFound()
  }

  const post = await getPost(locale, slug)
  if (!post) {
    notFound()
  }

  return (
    <Suspense fallback={<BlogPostSkeleton />}>
      <BlogPostContent locale={locale} slug={slug} />
    </Suspense>
  )
}
