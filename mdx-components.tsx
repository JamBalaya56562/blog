import type { MDXComponents } from "mdx/types"
import type React from "react"
import { resolveImagePath } from "@/app/api/images/[...path]/route"
import { createIdGenerator, extractText } from "@/lib/toc"

let generateId = createIdGenerator()

function headingId(props: React.HTMLAttributes<HTMLHeadingElement>) {
  return generateId(extractText(props.children))
}

const components: MDXComponents = {
  h1: (props) => (
    <h1 className="mt-8 mb-4 text-4xl font-bold text-foreground" {...props} />
  ),
  h2: (props) => (
    <h2
      id={headingId(props)}
      className="mt-6 mb-3 text-3xl font-semibold text-foreground"
      {...props}
    />
  ),
  h3: (props) => (
    <h3
      id={headingId(props)}
      className="mt-5 mb-2 text-2xl font-semibold text-foreground"
      {...props}
    />
  ),
  h4: (props) => (
    <h4 className="mt-4 mb-2 text-xl font-medium text-foreground" {...props} />
  ),
  p: (props) => <p className="my-4 leading-7 text-foreground" {...props} />,
  ul: (props) => (
    <ul className="my-4 ml-6 list-disc text-foreground" {...props} />
  ),
  ol: (props) => (
    <ol className="my-4 ml-6 list-decimal text-foreground" {...props} />
  ),
  li: (props) => <li className="my-1" {...props} />,
  pre: (props) => (
    <pre
      className="my-4 overflow-x-auto rounded-lg bg-gray-100 p-4 dark:bg-gray-800"
      {...props}
    />
  ),
  code: (props) => (
    <code
      className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-sm dark:bg-gray-800"
      {...props}
    />
  ),
  a: (props) => (
    <a
      className="text-blue-600 underline hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
      {...props}
    />
  ),
  img: ({ src, alt, ...props }) => {
    const resolvedSrc =
      src && !src.startsWith("http") ? resolveImagePath(src) : src
    return (
      <img
        src={resolvedSrc}
        alt={alt ?? ""}
        className="my-4 max-w-full rounded-lg"
        {...props}
      />
    )
  },
  blockquote: (props) => (
    <blockquote
      className="my-4 border-l-4 border-gray-300 pl-4 italic text-gray-600 dark:border-gray-600 dark:text-gray-400"
      {...props}
    />
  ),
  table: (props) => (
    <table className="my-4 w-full border-collapse text-foreground" {...props} />
  ),
  th: (props) => (
    <th
      className="border border-gray-300 bg-gray-50 px-4 py-2 text-left font-semibold dark:border-gray-600 dark:bg-gray-800"
      {...props}
    />
  ),
  td: (props) => (
    <td
      className="border border-gray-300 px-4 py-2 dark:border-gray-600"
      {...props}
    />
  ),
}

export function useMDXComponents(): MDXComponents {
  generateId = createIdGenerator()
  return components
}
