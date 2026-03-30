import { describe, expect, test } from "bun:test"
import fc from "fast-check"
import { resolveImagePath } from "@/app/api/images/[...path]/route"

describe("Image Proxy", () => {
  test("Property 13: image path resolution consistency", () => {
    fc.assert(
      fc.property(
        fc.stringMatching(
          /^[a-z0-9][a-z0-9/._-]{0,50}\.(png|jpg|jpeg|gif|webp|avif|svg)$/,
        ),
        (imagePath) => {
          const resolved = resolveImagePath(imagePath)
          expect(resolved.startsWith("/api/images/")).toBe(true)
          expect(resolved).toBe(`/api/images/${imagePath}`)
        },
      ),
      { numRuns: 100 },
    )
  })
})
