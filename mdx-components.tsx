import type { MDXComponents } from "mdx/types"
import type React from "react"
import { resolveImagePath } from "@/app/api/images/[...path]/route"
import { CodeTabs } from "@/components/code-tabs"
import { createIdGenerator, extractText } from "@/lib/toc"

let generateId = createIdGenerator()

function headingId(props: React.HTMLAttributes<HTMLHeadingElement>) {
  return generateId(extractText(props.children))
}

const components: MDXComponents = {
  blockquote: (props) => <blockquote className="my-4" {...props} />,
  // Capitalised because it is written as a JSX tag in the MDX source, not
  // produced by markdown syntax the way the lowercase entries here are.
  CodeTabs,
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
        loading="lazy"
        decoding="async"
        {...props}
      />
    )
  },
  li: (props) => <li className="my-1" {...props} />,
  ol: (props) => (
    <ol className="my-4 ml-6 list-decimal text-foreground" {...props} />
  ),
  p: (props) => <p className="my-4 leading-7 text-foreground" {...props} />,
  pre: ({ className, ...props }) => (
    <pre
      className={["rounded-lg", className].filter(Boolean).join(" ")}
      {...props}
    />
  ),
  // The scroller is the wrapper's job rather than the table's: `overflow-x` on
  // a `table` element does nothing without also making it a block, which throws
  // away the column sizing that makes a table a table. A table narrow enough to
  // fit is unaffected.
  table: (props) => (
    <div className="my-4 overflow-x-auto">
      <table className="text-foreground" {...props} />
    </div>
  ),
  th: (props) => <th className="font-semibold" {...props} />,
  ul: (props) => (
    <ul className="my-4 ml-6 list-disc text-foreground" {...props} />
  ),
}

export function useMDXComponents(): MDXComponents {
  generateId = createIdGenerator()
  return components
}
