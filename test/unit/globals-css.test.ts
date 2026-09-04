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

/** Selectors listed in the `prefers-reduced-motion` block. */
function reducedMotionSelectors(css: string): Set<string> {
  const root = postcss.parse(css)
  const listed = new Set<string>()
  root.walkAtRules("media", (media) => {
    if (!UNLAYERED_AT_RULE_PARAMS.has(media.params)) {
      return
    }
    media.walkRules((rule) => {
      for (const selector of rule.selectors) {
        listed.add(selector)
      }
    })
  })
  return listed
}

/**
 * Layered selectors that start an animation but are never switched off for a
 * user who asked for reduced motion.
 *
 * This is the guard for a bug the stylesheet has shipped twice: an animation
 * added to a component with nothing at the reduced-motion block to match it.
 * It only sees animations declared in `globals.css` — an inline `style`
 * animation or a Tailwind arbitrary-value utility has to route through a
 * class here to be covered at all, which is the point.
 */
function unguardedAnimations(css: string): string[] {
  const root = postcss.parse(css)
  const listed = reducedMotionSelectors(css)
  const offenders: string[] = []

  root.walkAtRules("layer", (layer) => {
    layer.walkRules((rule) => {
      const starts = rule.nodes?.some(
        (child) =>
          child.type === "decl" &&
          (child.prop === "animation" || child.prop === "animation-name") &&
          child.value !== "none",
      )
      if (!starts) {
        return
      }
      for (const selector of rule.selectors) {
        if (listed.has(selector)) {
          continue
        }
        offenders.push(selector)
      }
    })
  })

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

describe("app/globals.css reduced motion", () => {
  test("every layered animation is switched off under reduced motion", () => {
    expect(unguardedAnimations(CSS)).toEqual([])
  })

  test("catches an animation added with no reduced-motion entry", () => {
    // The guard is only worth having if it fails on the thing it guards.
    expect(
      unguardedAnimations(
        `${CSS}\n@layer components {\n  .pp-regression { animation: spinSlow 1s linear infinite; }\n}\n`,
      ),
    ).toEqual([".pp-regression"])
  })

  test("accepts an animation that is listed in the block", () => {
    expect(
      unguardedAnimations(
        `${CSS}\n@layer components {\n  .pp-regression { animation: spinSlow 1s linear infinite; }\n}\n` +
          "@media (prefers-reduced-motion: reduce) {\n  .pp-regression { animation: none; }\n}\n",
      ),
    ).toEqual([])
  })
})

describe("app/globals.css directional view transitions", () => {
  /**
   * These four rules sat in the stylesheet unused for a long time: they
   * select on a `view-transition-class`, which only exists once a page is
   * wrapped in `PageTransition` and a link carries `transitionTypes`. Pin
   * both halves so neither can be removed without the other failing.
   */
  test("the nav-forward and nav-back pseudo-element rules are present", () => {
    const root = postcss.parse(CSS)
    const selectors = new Set<string>()
    root.walkRules((rule) => {
      for (const selector of rule.selectors) {
        selectors.add(selector)
      }
    })
    for (const direction of ["nav-forward", "nav-back"]) {
      expect(selectors).toContain(`::view-transition-old(.${direction})`)
      expect(selectors).toContain(`::view-transition-new(.${direction})`)
    }
  })

  test("reduced motion outranks them", () => {
    // The directional rules take their specificity from the class argument
    // and sit later in the file, so the `(*)` cap only wins with the flags.
    const root = postcss.parse(CSS)
    const flagged: string[] = []
    root.walkAtRules("media", (media) => {
      if (!UNLAYERED_AT_RULE_PARAMS.has(media.params)) {
        return
      }
      media.walkDecls((decl) => {
        if (decl.important) {
          flagged.push(decl.prop)
        }
      })
    })
    expect(flagged).toContain("animation-duration")
  })
})
