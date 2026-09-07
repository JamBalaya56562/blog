import { describe, expect, test } from "bun:test"
import manifest from "@/app/manifest"
import { defaultLocale, locales } from "@/lib/i18n/config"
import { getDictionary } from "@/lib/i18n/get-dictionary"
import { THEME_BACKGROUND } from "@/lib/theme/colors"

describe("web app manifest", () => {
  // It shipped as "#fff" on a site whose light background is #f4f7fa and whose
  // dark background is near-black, so an installed app flashed white on launch.
  test("its colours come from the stylesheet rather than a literal", () => {
    const m = manifest()
    expect(m.background_color).toBe(THEME_BACKGROUND.light)
    expect(m.theme_color).toBe(THEME_BACKGROUND.light)
    expect(m.background_color).not.toBe("#fff")
  })

  // It read "Jam Blog" while every rendered surface says "Jam's Blog".
  test("the name matches what the site calls itself", () => {
    const m = manifest()
    const { siteName } = getDictionary(defaultLocale).header
    expect(m.name).toBe(siteName)
    expect(m.short_name).toBe(siteName)
  })

  // A home-screen label is truncated past roughly this length.
  test("the short name stays short enough for a home screen", () => {
    expect((manifest().short_name ?? "").length).toBeLessThanOrEqual(12)
  })

  test("it still declares both icon sizes and a start URL", () => {
    const m = manifest()
    expect(m.icons?.map((i) => i.sizes).sort()).toEqual(["192x192", "512x512"])
    expect(m.start_url).toBe("/")
  })

  test("the locale it names itself in is a real locale", () => {
    expect(locales).toContain(defaultLocale)
  })
})
