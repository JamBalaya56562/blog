import type { Route } from "next"
import Link from "next/link"
import { TagLink } from "@/components/home/tag-link"
import type { Post } from "@/lib/content/types"
import type { Locale } from "@/lib/i18n/config"
import type { Dictionary } from "@/lib/i18n/get-dictionary"
import { getBlogPostPath } from "@/lib/routes"

interface RecentDispatchesProps {
  readonly locale: Locale
  readonly dictionary: Dictionary
  readonly posts: Post[]
}

export function RecentDispatches({
  locale,
  dictionary,
  posts,
}: Readonly<RecentDispatchesProps>) {
  if (posts.length === 0) {
    return null
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-20">
      <div className="mb-12 flex items-end justify-between">
        <div className="max-w-xl">
          <h2 className="mb-4 font-headline text-3xl font-bold text-primary dark:text-white">
            {dictionary.home.recentTitle}
          </h2>
          <p className="font-sans text-on-surface-variant">
            {dictionary.home.recentDescription}
          </p>
        </div>
        <Link
          href={`/${locale}/blog` as Route}
          className="flex items-center gap-2 font-semibold text-primary dark:text-primary-fixed"
        >
          {dictionary.home.viewAll}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </svg>
        </Link>
      </div>

      <div className="space-y-4">
        {posts.map((post, index) => {
          const tag = post.frontmatter.tags[0]
          const number = String(index + 1).padStart(2, "0")

          return (
            <Link
              key={post.slug}
              href={getBlogPostPath(locale, post.slug)}
              className="card-title-hover group flex flex-col justify-between rounded-xl border-l-2
                border-transparent bg-surface p-6 transition-all
                hover:border-primary-fixed hover:bg-surface-container-low
                md:flex-row md:items-center"
            >
              <div className="flex items-center gap-8">
                <span className="hidden font-mono text-sm text-secondary opacity-50 md:block">
                  {number}
                </span>
                <div>
                  <h3 className="card-title font-headline text-xl font-bold text-primary transition-colors dark:text-white">
                    {post.frontmatter.title}
                  </h3>
                  <div className="mt-1 flex gap-4">
                    <span className="text-xs font-medium text-secondary">
                      {post.frontmatter.date}
                    </span>
                    {tag && (
                      <TagLink
                        tag={tag}
                        locale={locale}
                        className="cursor-pointer rounded-full bg-secondary-container px-2 text-xs text-on-secondary-container transition-colors hover:bg-primary hover:text-on-primary"
                      />
                    )}
                  </div>
                </div>
              </div>
              <div
                className="mt-4 flex items-center gap-2 font-medium text-primary opacity-0
                  transition-opacity group-hover:opacity-100 dark:text-primary-fixed md:mt-0"
              >
                {dictionary.home.readDispatch}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="m7 7 10 10" />
                  <path d="M7 17h10V7" />
                </svg>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
