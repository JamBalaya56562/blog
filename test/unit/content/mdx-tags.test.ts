import { describe, expect, test } from "bun:test"
import { useMDXComponents } from "@/mdx-components"

const POSTS = [...new Bun.Glob("content/posts/*/*.mdx").scanSync(".")]
  .map((path) => path.replaceAll("\\", "/"))
  .sort()

/** The custom tags a post uses, one entry per use, code left out. */
async function tagsOf(path: string): Promise<string[]> {
  const text = await Bun.file(path).text()
  const prose = text.replace(/^```[\s\S]*?^```/gm, "").replace(/`[^`\n]*`/g, "")
  return [...prose.matchAll(/<([A-Z][A-Za-z]*)[\s/>]/g)]
    .map((match) => match[1])
    .sort()
}

const TAGS = new Map(
  await Promise.all(
    POSTS.map(async (path) => [path, await tagsOf(path)] as const),
  ),
)

/**
 * A custom tag in a post is only a component if `mdx-components.tsx` maps it;
 * anything else is passed to React as an unknown element and fails the build
 * of every page. The build says so, eventually — this says so in a second.
 */
describe("custom tags in posts", () => {
  test("every tag a post uses is a registered component", () => {
    const components = useMDXComponents()
    for (const [path, tags] of TAGS) {
      for (const tag of new Set(tags)) {
        expect(components[tag], `${path} uses <${tag}>`).toBeDefined()
      }
    }
  })

  /**
   * The two locales of a post are meant to be the same article: when one
   * gains a figure the other gains it too, else the languages drift apart.
   */
  test("both locales of a post use the same tags", () => {
    const bySlug = new Map<string, Map<string, string[]>>()
    for (const [path, tags] of TAGS) {
      const [, locale, file] =
        /content\/posts\/([^/]+)\/([^/]+)$/.exec(path) ?? []
      if (!locale || !file) {
        throw new Error(`unexpected post path ${path}`)
      }
      const locales = bySlug.get(file) ?? new Map<string, string[]>()
      locales.set(locale, tags)
      bySlug.set(file, locales)
    }
    for (const [file, locales] of bySlug) {
      const [first, ...rest] = [...locales.values()]
      for (const other of rest) {
        expect(other, `${file} differs between locales`).toEqual(first)
      }
    }
  })

  test("the layer-cache figure is in the Dockerfile post", () => {
    expect(TAGS.get("content/posts/ja/docker-build.mdx")).toContain(
      "LayerCache",
    )
    expect(TAGS.get("content/posts/en/docker-build.mdx")).toContain(
      "LayerCache",
    )
  })
})
