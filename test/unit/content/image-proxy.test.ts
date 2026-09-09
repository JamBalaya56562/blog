import { describe, expect, test } from "bun:test"
import fc from "fast-check"
import { GET, resolveImagePath } from "@/app/api/images/[...path]/route"

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

/**
 * The route answered with a `Content-Type` and nothing else, so every content
 * image was refetched on every page view. It reads from disk today; the same
 * handler fetches from raw.githubusercontent.com when `CONTENT_SOURCE` is
 * `github`, where an uncached response also spends someone's rate limit.
 */
describe("Image proxy caching", () => {
  test("a served image is cacheable", async () => {
    const response = await GET(
      new Request("http://localhost/api/images/next.svg"),
      {
        params: Promise.resolve({ path: ["next.svg"] }),
      },
    )

    expect(response.status).toBe(200)
    expect(response.headers.get("Content-Type")).toBe("image/svg+xml")
    expect(response.headers.get("Cache-Control")).toContain("max-age=")
  })

  test("a traversal attempt is still refused, and not cached", async () => {
    const response = await GET(
      new Request("http://localhost/api/images/../secret"),
      {
        params: Promise.resolve({ path: ["..", "secret"] }),
      },
    )

    expect(response.status).toBe(400)
    expect(response.headers.get("Cache-Control")).toBeNull()
  })
})
