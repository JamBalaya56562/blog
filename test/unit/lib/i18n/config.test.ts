import { describe, expect, test } from "bun:test"
import { defaultLocale, isValidLocale, locales } from "@/lib/i18n/config"

describe("i18n config", () => {
  test("locales contains en and ja", () => {
    expect(locales).toContain("en")
    expect(locales).toContain("ja")
    expect(locales).toHaveLength(2)
  })

  test("default locale is en", () => {
    expect(defaultLocale).toBe("en")
  })

  test("isValidLocale returns true for supported locales", () => {
    expect(isValidLocale("en")).toBe(true)
    expect(isValidLocale("ja")).toBe(true)
  })

  test("isValidLocale returns false for unsupported locales", () => {
    expect(isValidLocale("fr")).toBe(false)
    expect(isValidLocale("")).toBe(false)
    expect(isValidLocale("EN")).toBe(false)
  })
})
