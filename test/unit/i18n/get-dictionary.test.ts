import { describe, expect, test } from "bun:test"
import { getDictionary } from "@/lib/i18n/get-dictionary"

describe("getDictionary", () => {
  test("returns English dictionary for en locale", () => {
    const dict = getDictionary("en")
    expect(dict.nav.home).toBe("Home")
    expect(dict.nav.blog).toBe("Blog")
    expect(dict.language.current).toBe("English")
  })

  test("returns Japanese dictionary for ja locale", () => {
    const dict = getDictionary("ja")
    expect(dict.nav.home).toBe("ホーム")
    expect(dict.nav.blog).toBe("ブログ")
    expect(dict.language.current).toBe("日本語")
  })

  test("both dictionaries have the same keys", () => {
    const en = getDictionary("en")
    const ja = getDictionary("ja")

    const getKeys = (obj: Record<string, unknown>, prefix = ""): string[] =>
      Object.entries(obj).flatMap(([key, value]) => {
        const path = prefix ? `${prefix}.${key}` : key
        if (typeof value === "object" && value !== null) {
          return getKeys(value as Record<string, unknown>, path)
        }
        return [path]
      })

    const enKeys = getKeys(en).sort()
    const jaKeys = getKeys(ja).sort()
    expect(enKeys).toEqual(jaKeys)
  })
})
