import type { Metadata, Route } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { MDXRemote } from "next-mdx-remote-client/rsc"
import { cache, ViewTransition } from "react"
import remarkGfm from "remark-gfm"
import {
  DEFAULT_THUMBNAIL,
  estimateReadingTime,
} from "@/components/article-card"
import { PostNavigation } from "@/components/post-navigation"
import { getRelatedPosts, RelatedPosts } from "@/components/related-posts"
import { TableOfContents } from "@/components/table-of-contents"
import { ViewCounter } from "@/components/view-counter"
import { findAdjacentPosts } from "@/lib/content/adjacent"
import { createContentLoader } from "@/lib/content/loader"
import { getViewCount } from "@/lib/db/queries"
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
  }
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<Params>
}) {
  "use cache"
  const { locale, slug } = await params
  if (!isValidLocale(locale)) {
    notFound()
  }

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

  return (
    <div className="mx-auto max-w-3xl">
      <TableOfContents items={tocItems} title={dictionary.blog.toc} />
      <article>
        <header className="mb-8">
          <ViewTransition name={`post-title-${slug}`} share="morph">
            <h1 className="text-4xl font-bold">{post.frontmatter.title}</h1>
          </ViewTransition>
          <ViewTransition name={`post-meta-${slug}`} share="morph">
            <div className="mt-2 flex flex-wrap items-center gap-x-3 text-gray-500 dark:text-gray-400">
              <span className="basis-full md:basis-auto">
                {dictionary.blog.postedOn} {post.frontmatter.date}
              </span>
              <span className="hidden md:inline">·</span>
              <ViewCounter slug={slug} count={viewCount} />
              <span>·</span>
              <span>{estimateReadingTime(post.content)} min read</span>
            </div>
          </ViewTransition>
          <div className="mt-2 flex gap-2">
            {post.frontmatter.tags.map((tag) => (
              <Link
                key={tag}
                href={`/${locale}/blog?tag=${encodeURIComponent(tag)}` as Route}
                className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                {tag}
              </Link>
            ))}
          </div>
          {translationLocale && (
            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
              {dictionary.blog.translationAvailable}{" "}
              <Link
                href={getBlogPostPath(translationLocale, slug)}
                className="text-blue-600 hover:underline dark:text-blue-400"
              >
                {getDictionary(translationLocale).language.current}
              </Link>
            </p>
          )}
        </header>
        <ViewTransition name={`post-image-${slug}`} share="morph">
          <div className="mb-12 overflow-hidden rounded-xl aspect-[21/9]">
            <Image
              src={post.frontmatter.image ?? DEFAULT_THUMBNAIL}
              alt={post.frontmatter.title}
              width={1200}
              height={514}
              className="h-full w-full object-cover"
            />
          </div>
        </ViewTransition>
        <div className="prose dark:prose-invert max-w-none">
          <MDXRemote
            source={post.content}
            options={{ mdxOptions: { remarkPlugins: [remarkGfm] } }}
            components={useMDXComponents()}
          />
        </div>
      </article>
      <RelatedPosts
        locale={locale}
        posts={getRelatedPosts(allPosts, slug)}
        dictionary={dictionary}
      />
      <PostNavigation
        locale={locale}
        adjacentPosts={adjacentPosts}
        dictionary={dictionary}
      />
    </div>
  )
}
