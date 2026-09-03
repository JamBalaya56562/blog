import type { MDXComponents } from "mdx/types"
import type React from "react"
import { resolveImagePath } from "@/app/api/images/[...path]/route"
import { createIdGenerator, extractText } from "@/lib/toc"

let generateId = createIdGenerator()

function headingId(props: React.HTMLAttributes<HTMLHeadingElement>) {
  return generateId(extractText(props.children))
}

/**
 * MDX element overrides.
 *
 * Prose styling lives in `.prose-cyber` (app/globals.css) — colours, borders,
 * padding, margins and type scale all come from there so the article body
 * follows the theme tokens. These overrides carry only what `.prose-cyber`
 * does not set; `a`, `td` and anything else it fully owns are left to it.
 * Re-stating a property here would now win over the stylesheet, since
 * `.prose-cyber` sits in `@layer components`.
 */
const components: MDXComponents = {
  blockquote: (props) => <blockquote className="my-4" {...props} />,
  code: (props) => <code className="rounded" {...props} />,
  h1: (props) => <h1 className="text-4xl font-bold" {...props} />,
  h2: (props) => (
    <h2 id={headingId(props)} className="font-semibold" {...props} />
  ),
  h3: (props) => (
    <h3 id={headingId(props)} className="font-semibold" {...props} />
  ),
  h4: (props) => <h4 className="text-xl font-medium" {...props} />,
  img: ({ src, alt, ...props }) => {
    const resolvedSrc =
      src && !src.startsWith("http") ? resolveImagePath(src) : src
    return (
      // biome-ignore lint/performance/noImgElement: MDX images have unknown intrinsic dimensions and `images.unoptimized` is enabled, so next/image adds no benefit here
      <img
        src={resolvedSrc}
        alt={alt ?? ""}
        className="my-4 max-w-full rounded-lg"
        {...props}
      />
    )
  },
  li: (props) => <li className="my-1" {...props} />,
  ol: (props) => (
    <ol className="my-4 ml-6 list-decimal text-foreground" {...props} />
  ),
  p: (props) => <p className="my-4 leading-7 text-foreground" {...props} />,
  pre: (props) => <pre className="rounded-lg" {...props} />,
  table: (props) => <table className="my-4 text-foreground" {...props} />,
  th: (props) => <th className="font-semibold" {...props} />,
  ul: (props) => (
    <ul className="my-4 ml-6 list-disc text-foreground" {...props} />
  ),
}

export function useMDXComponents(): MDXComponents {
  generateId = createIdGenerator()
  return components
}
