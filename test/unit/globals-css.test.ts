import { describe, expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import postcss, { type ChildNode, type Container } from "postcss"

/**
 * Guards the cascade contract of `app/globals.css`.
 *
 * `@import "tailwindcss"` establishes `theme, base, components, utilities`, and
 * an unlayered rule outranks every layered one no matter its specificity. A
 * style rule left at the top level therefore beats any Tailwind utility written
 * on the same element — silently, with nothing at either site to hint at it.
 * That is how `tracking-tight`, `font-extrabold`, `.pp-tick` colours and the
 * whole `mdx-components.tsx` palette ended up dead.
 */

const CSS = readFileSync(
  new URL("../../app/globals.css", import.meta.url),
  "utf8",
)

/**
 * Top-level selectors allowed to stay outside a layer, each because a utility
 * class cannot reach the element it matches.
 */
const UNLAYERED_SELECTORS = [
  // View transition pseudo-elements exist outside the document tree.
  /^::view-transition-(old|new|group)\(/,
]

/** At-rules that carry no cascading declarations of their own. */
const NON_CASCADING_AT_RULES = new Set([
  "import",
  "custom-variant",
  "theme",
  "keyframes",
  "layer",
])

/**
 * Media queries allowed at the top level. `prefers-reduced-motion` must outrank
 * utilities: a user asking for less motion should win over any
 * `animate-*` class.
 */
const UNLAYERED_AT_RULE_PARAMS = new Set(["(prefers-reduced-motion: reduce)"])

/** A rule is inert in the cascade if it only defines custom properties. */
function declaresOnlyCustomProperties(node: Container<ChildNode>): boolean {
  let sawDeclaration = false
  for (const child of node.nodes ?? []) {
    if (child.type === "comment") {
      continue
    }
    if (child.type !== "decl") {
      return false
    }
    sawDeclaration = true
    if (!child.prop.startsWith("--")) {
      return false
    }
  }
  return sawDeclaration
}

function unlayeredStyleRules(css: string): string[] {
  const root = postcss.parse(css)
  const offenders: string[] = []

  for (const node of root.nodes) {
    if (node.type === "atrule") {
      if (NON_CASCADING_AT_RULES.has(node.name)) {
        continue
      }
      if (node.name === "media" && UNLAYERED_AT_RULE_PARAMS.has(node.params)) {
        continue
      }
      offenders.push(`@${node.name} ${node.params}`)
      continue
    }
    if (node.type !== "rule") {
      continue
    }
    if (UNLAYERED_SELECTORS.some((re) => re.test(node.selector))) {
      continue
    }
    // `:root` / `.dark` only carry theme tokens, which no utility competes with.
    if (declaresOnlyCustomProperties(node)) {
      continue
    }
    offenders.push(node.selector)
  }

  return offenders
}

describe("app/globals.css cascade layers", () => {
  test("no style rule sets a normal property outside a layer", () => {
    expect(unlayeredStyleRules(CSS)).toEqual([])
  })

  test("the layers the stylesheet is expected to use are present", () => {
    const root = postcss.parse(CSS)
    const layers = root.nodes
      .filter((n) => n.type === "atrule" && n.name === "layer")
      .map((n) => (n as { params: string }).params)
    expect(layers).toContain("base")
    expect(layers).toContain("components")
  })

  test("catches a rule reintroduced outside a layer", () => {
    // The guard is only worth having if it fails on the thing it guards.
    expect(
      unlayeredStyleRules(`${CSS}\n.pp-regression { color: red; }\n`),
    ).toEqual([".pp-regression"])
  })

  test("still allows a token-only rule outside a layer", () => {
    expect(
      unlayeredStyleRules(`${CSS}\n.high-contrast { --cyber-cyan: #0ff; }\n`),
    ).toEqual([])
  })
})
