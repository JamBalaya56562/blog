import { describe, expect, test } from "bun:test"
import en from "@/lib/i18n/dictionaries/en.json"
import ja from "@/lib/i18n/dictionaries/ja.json"

const SOURCES = await Promise.all(
  [
    ...new Bun.Glob("{app,components,lib}/**/*.{ts,tsx}").scanSync("."),
    "mdx-components.tsx",
  ]
    .filter((path) => !path.includes("/dictionaries/"))
    .map((path) => Bun.file(path).text()),
)
const CODE = SOURCES.join("\n")

function leaves(value: unknown, path = ""): string[] {
  if (typeof value !== "object" || value === null) {
    return [path]
  }
  return Object.entries(value).flatMap(([key, child]) =>
    leaves(child, path ? `${path}.${key}` : key),
  )
}

/**
 * A dictionary entry nothing reads is invisible: both locales keep translating
 * it, it ships in the bundle, and the page looks right either way. Three had
 * collected by the time this was written.
 *
 * The name is what is searched for, not the path, because the portfolio page
 * reads some of these as `dictionary.portfolio[oss.descriptionKey]` — the key
 * appears in `lib/portfolio.ts` rather than at the call site.
 */
describe("translation keys", () => {
  test("every key is read by something", () => {
    const unused = leaves(en).filter((path) => {
      const name = path.split(".").at(-1) ?? ""
      return !new RegExp(`\\b${name}\\b`).test(CODE)
    })

    expect(unused).toEqual([])
  })

  test("both locales carry the same keys", () => {
    expect(leaves(ja).sort()).toEqual(leaves(en).sort())
  })
})
