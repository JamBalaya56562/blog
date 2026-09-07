import { describe, expect, test } from "bun:test"
import { locales } from "@/lib/i18n/config"
import { getDictionary } from "@/lib/i18n/get-dictionary"
import { featuredContribution, ossContributions, skills } from "@/lib/portfolio"

describe("portfolio data", () => {
  test("there is something to render", () => {
    expect(skills.length).toBeGreaterThan(0)
    expect(ossContributions.length).toBeGreaterThan(0)
  })

  // The grid renders the array in order, so the order is the ranking. Adding an
  // entry in the wrong place puts a smaller contribution above a larger one
  // with nothing to catch it.
  test("contributions are listed newest-merged first", () => {
    const merged = ossContributions.map((c) => c.merged)
    expect([...merged].sort((a, b) => b - a)).toEqual(merged)
  })

  // Mise leads as the wide card at the head of the grid because it has by far
  // the most merged work; if another entry overtakes it, the layout is lying.
  test("the featured contribution outranks the rest", () => {
    for (const contribution of ossContributions) {
      expect(featuredContribution.merged).toBeGreaterThan(contribution.merged)
    }
  })

  test("every contribution is distinct", () => {
    const names = [
      featuredContribution.name,
      ...ossContributions.map((c) => c.name),
    ]
    expect(new Set(names).size).toBe(names.length)
  })

  test("every link is an https GitHub URL", () => {
    for (const { url } of [featuredContribution, ...ossContributions]) {
      expect(url.startsWith("https://github.com/")).toBe(true)
    }
  })

  // The card body is `dictionary.portfolio[descriptionKey]`. TypeScript proves
  // the key exists; this proves it resolves to real text in both locales
  // rather than an empty string.
  test("every description key resolves in both locales", () => {
    for (const locale of locales) {
      const { portfolio } = getDictionary(locale)
      for (const { descriptionKey } of [
        featuredContribution,
        ...ossContributions,
      ]) {
        expect(portfolio[descriptionKey].length).toBeGreaterThan(0)
      }
    }
  })
})
