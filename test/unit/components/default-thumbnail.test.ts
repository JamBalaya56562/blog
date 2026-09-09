import { describe, expect, test } from "bun:test"
import { DEFAULT_THUMBNAIL } from "@/components/article-card"

const file = Bun.file(`public${DEFAULT_THUMBNAIL}`)

/**
 * Every post falls back to this one image — the hero on the post page and the
 * card in all three lists — so it is the most requested asset on the site. It
 * shipped as an 852KB PNG, which the production headers then served with
 * `max-age=0`.
 *
 * The budget is the point of the test: the exact bytes will drift when the
 * image is redrawn, but a re-export that lands two orders of magnitude off is
 * the mistake worth catching, and nothing about the page looks wrong when it
 * happens.
 */
describe("default thumbnail", () => {
  test("is AVIF", async () => {
    expect(DEFAULT_THUMBNAIL.endsWith(".avif")).toBe(true)

    const header = Buffer.from(await file.slice(0, 32).arrayBuffer())
    expect(header.includes(Buffer.from("ftyp"))).toBe(true)
    expect(header.includes(Buffer.from("avif"))).toBe(true)
  })

  test("stays under 60KB", () => {
    expect(file.size).toBeGreaterThan(0)
    expect(file.size).toBeLessThan(60 * 1024)
  })
})
