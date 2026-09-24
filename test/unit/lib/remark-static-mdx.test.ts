import { afterEach, describe, expect, test } from "bun:test"
import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { evaluate } from "next-mdx-remote-client/rsc"
import remarkGfm from "remark-gfm"
import { parseFrontmatter } from "@/lib/content/frontmatter"
import { remarkAlerts } from "@/lib/remark-alerts"
import { remarkStaticMdx } from "@/lib/remark-static-mdx"

/**
 * MDX evaluates a post as a JavaScript module on the server. With
 * `CONTENT_SOURCE=github` the source is fetched at request time, so anything
 * that can change it could run code on the function.
 */

const probe = globalThis as { __mdxRan?: boolean }

afterEach(() => {
  delete probe.__mdxRan
})

async function run(source: string, plugins: unknown[] = [remarkStaticMdx]) {
  return evaluate({
    options: { mdxOptions: { remarkPlugins: plugins as never } },
    source,
  })
}

describe("MDX evaluation", () => {
  // The hole itself: without the plugin, an export in a post runs as soon as
  // the post is evaluated, before anything is rendered.
  const payload = "export const x = (globalThis.__mdxRan = true)"

  test("without the check, code in a post runs on the server", async () => {
    const { error } = await run(payload, [])
    expect(error).toBeUndefined()
    expect(probe.__mdxRan).toBe(true)
  })

  test("with the check, it is refused before anything runs", async () => {
    const { error } = await run(payload)
    expect(error?.message).toContain("MDX import/export at 1:1 is not allowed")
    expect(probe.__mdxRan).toBeUndefined()
  })
})

describe("remarkStaticMdx refuses code", () => {
  const cases: [string, string][] = [
    ['import fs from "node:fs"', "import/export"],
    ["export const x = globalThis", "import/export"],
    ["{process.exit(1)}", "expression"],
    ["Some text {1 + 1} inline.", "expression"],
    ["<X a={process.env.SECRET} />", 'expression in attribute "a"'],
    ["<X a={[globalThis]} />", 'expression in attribute "a"'],
    ["<X a={{ [key]: 1 }} />", 'expression in attribute "a"'],
    ["<X a={{ key }} />", 'expression in attribute "a"'],
    // biome-ignore lint/suspicious/noTemplateCurlyInString: MDX source, not a template
    ["<X a={`${secret}`} />", 'expression in attribute "a"'],
    ["<X a={() => 1} />", 'expression in attribute "a"'],
    ["<X {...globalThis} />", "spread attribute"],
  ]

  for (const [source, what] of cases) {
    test(source, async () => {
      const { error } = await run(source)
      expect(error?.message).toContain(`MDX ${what}`)
    })
  }
})

describe("remarkStaticMdx lets plain values through", () => {
  const cases = [
    '<X a={[1, "b", { c: true, d: null, "e-f": -1 }]} b="c" d />',
    "<X a={`no holes`} />",
    "{/* a comment */}",
    '{"a plain string"}',
  ]

  for (const source of cases) {
    test(source, async () => {
      const { error } = await run(source)
      expect(error).toBeUndefined()
    })
  }
})

// The check has to pass every post there is, or it would break the build.
describe("every post in the repository", () => {
  const root = join(process.cwd(), "content", "posts")
  for (const locale of readdirSync(root)) {
    for (const file of readdirSync(join(root, locale))) {
      test(`${locale}/${file}`, async () => {
        const { content } = parseFrontmatter(
          readFileSync(join(root, locale, file), "utf8"),
        )
        const { error } = await run(content, [
          remarkStaticMdx,
          remarkGfm,
          remarkAlerts,
        ])
        expect(error).toBeUndefined()
      })
    }
  }
})
