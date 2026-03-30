import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { MDXRemote } from "next-mdx-remote-client/rsc"
import { cache } from "react"
import remarkGfm from "remark-gfm"
import { createContentLoader } from "@/lib/content/loader"
import type { Locale } from "@/lib/i18n/config"
import { isValidLocale, locales } from "@/lib/i18n/config"
import { getDictionary } from "@/lib/i18n/get-dictionary"
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
  const translationLocale = await getTranslationPair(locale, slug)

  return (
    <article>
      <header className="mb-8">
        <h1 className="text-4xl font-bold">{post.frontmatter.title}</h1>
        <p className="mt-2 text-gray-500 dark:text-gray-400">
          {dictionary.blog.postedOn} {post.frontmatter.date}
        </p>
        <div className="mt-2 flex gap-2">
          {post.frontmatter.tags.map((tag) => (
            <a
              key={tag}
              href={`/${locale}/blog?tag=${encodeURIComponent(tag)}`}
              className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              {tag}
            </a>
          ))}
        </div>
        {translationLocale && (
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
            {dictionary.blog.translationAvailable}{" "}
            <a
              href={`/${translationLocale}/blog/${slug}`}
              className="text-blue-600 hover:underline dark:text-blue-400"
            >
              {getDictionary(translationLocale).language.current}
            </a>
          </p>
        )}
      </header>
      <div className="prose dark:prose-invert max-w-none">
        <MDXRemote
          source={post.content}
          options={{ mdxOptions: { remarkPlugins: [remarkGfm] } }}
          components={useMDXComponents()}
        />
      </div>
    </article>
  )
}
