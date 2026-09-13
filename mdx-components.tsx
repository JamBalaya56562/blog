import type { MDXComponents } from "mdx/types"
import type React from "react"
import { Children, isValidElement } from "react"
import { resolveImagePath } from "@/app/api/images/[...path]/route"
import { CodeTabs } from "@/components/code-tabs"
import { CopyButton } from "@/components/copy-button"
import { createIdGenerator, extractText } from "@/lib/toc"

type BlockquoteProps = React.BlockquoteHTMLAttributes<HTMLQuoteElement> & {
  "data-alert"?: string
}

let generateId = createIdGenerator()

function headingId(props: React.HTMLAttributes<HTMLHeadingElement>) {
  return generateId(extractText(props.children))
}

/**
 * The language Shiki wrote onto the `<code>` inside a fence, as
 * `language-toml`, or nothing when no child of the block carries one.
 */
function languageOf(children: React.ReactNode): string | undefined {
  for (const child of Children.toArray(children)) {
    if (!isValidElement<{ className?: string }>(child)) {
      continue
    }
    const language = child.props.className?.match(/(?:^|\s)language-([\w-]+)/)
    if (language) {
      return language[1]
    }
  }
  return undefined
}

/**
 * How many lines a highlighted fence has, and how many of them the
 * highlighter marked as commands. Read off the `.line` spans Shiki emits, so
 * the numbers in the terminal frame's foot always agree with what is shown.
 */
function countLines(children: React.ReactNode): {
  commands: number
  lines: number
} {
  let commands = 0
  let lines = 0
  const walk = (node: React.ReactNode) => {
    for (const child of Children.toArray(node)) {
      if (
        !isValidElement<{
          className?: string
          "data-cmd"?: string
          children?: React.ReactNode
        }>(child)
      ) {
        continue
      }
      if (child.props.className === "line") {
        lines += 1
        if (child.props["data-cmd"] !== undefined) {
          commands += 1
        }
        continue
      }
      walk(child.props.children)
    }
  }
  walk(children)
  return { commands, lines }
}

const components: MDXComponents = {
  blockquote: ({
    "data-alert": alert,
    children,
    ...props
  }: BlockquoteProps) => {
    if (!alert) {
      return (
        <blockquote className="my-4" {...props}>
          {children}
        </blockquote>
      )
    }
    // A GitHub-style alert, tagged by `lib/remark-alerts.ts`. An aside rather
    // than a blockquote: the text is the author's own, set beside the flow,
    // not something quoted from elsewhere.
    return (
      // The rest of the props go through — an `id` or `aria-*` set by another
      // transform should survive — with the callout's own role, class and kind
      // written last so they win. Cast because the props are typed for a
      // quote element and the target is a plain one; the attributes are the
      // same set.
      <aside
        {...(props as React.HTMLAttributes<HTMLElement>)}
        role="note"
        className="pp-alert my-4"
        data-alert={alert}
      >
        <div className="pp-alert-label">{alert.toUpperCase()}</div>
        <div>{children}</div>
      </aside>
    )
  },
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
  // Every block is a panel: a strip above the code with a prompt glyph, the
  // file name when the fence gave one, and the language at the right, over a
  // faint grid that shows through the strip (the code face itself is opaque).
  // The copy button reads the `<pre>` next to it, so the wrapper is also what
  // it sits in; inside `CodeTabs` the tab strip stands in for this one and
  // globals.css hides it.
  pre: ({ className, title, children, ...props }) => {
    const language = languageOf(children)
    // A terminal transcript is a different object from a code block: the
    // reader is looking at what was typed and what came back, not at a file.
    // It gets a window instead of a file strip — signal lights and a name
    // above, the counts below — and a copy button that takes the commands
    // only. The prompt lines are marked by `lib/highlight.ts`.
    if (language === "console" || language === "shellsession") {
      const { commands, lines } = countLines(children)
      return (
        <div className="pp-term pp-copy-wrap">
          <div className="pp-term-head">
            <span aria-hidden className="pp-term-sig">
              <span />
              <span />
              <span />
            </span>
            <span className="pp-term-name">{title ?? "terminal"}</span>
          </div>
          <CopyButton commands />
          <pre className={className} {...props}>
            {children}
          </pre>
          <div className="pp-term-foot">
            <span>
              <b>{commands}</b> commands
            </span>
            <span>
              <b>{lines}</b> lines
            </span>
          </div>
        </div>
      )
    }
    return (
      <div className="pp-code pp-copy-wrap">
        <div className="pp-code-title">
          <span className="pp-code-name">{title}</span>
          {language && <span className="pp-code-lang">{language}</span>}
        </div>
        <CopyButton />
        <pre className={className} {...props}>
          {children}
        </pre>
      </div>
    )
  },
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
