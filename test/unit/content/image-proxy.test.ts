import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test"
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
      new Request("http://localhost/api/images/mise-one-file.svg"),
      {
        params: Promise.resolve({ path: ["mise-one-file.svg"] }),
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

/**
 * With `CONTENT_SOURCE=github` the path is put into a raw.githubusercontent.com
 * URL. Next has decoded the request once, so `%252e%252e` arrives as the text
 * `%2e%2e`: not `..` to the old `includes("..")` check, but `..` to the URL
 * parser that `fetch` runs, which walked the fetch out of `content/images/`
 * and into any repository on GitHub, served from this origin.
 */
describe("Image proxy with the GitHub source", () => {
  const PREFIX = "/owner/repo/main/content/images/"
  const saved = { ...process.env }
  const realFetch = globalThis.fetch
  let fetched: string[] = []

  beforeEach(() => {
    process.env.CONTENT_SOURCE = "github"
    process.env.GITHUB_OWNER = "owner"
    process.env.GITHUB_REPO = "repo"
    process.env.GITHUB_BRANCH = "main"
    process.env.GITHUB_CONTENT_PATH = "content"
    fetched = []
    globalThis.fetch = mock(async (input: string | URL | Request) => {
      fetched.push(new URL(String(input)).pathname)
      return new Response("img", { status: 200 })
    }) as unknown as typeof fetch
  })

  afterEach(() => {
    process.env = { ...saved }
    globalThis.fetch = realFetch
  })

  function get(path: string[]) {
    return GET(new Request("http://localhost/api/images/x"), {
      params: Promise.resolve({ path }),
    })
  }

  test("a double-encoded climb out of the images directory is refused", async () => {
    for (const dots of ["%2e%2e", "%2E%2e", ".%2e", "%2e."]) {
      const res = await get([
        dots,
        dots,
        dots,
        "other",
        "repo",
        "main",
        "x.png",
      ])
      expect(res.status).toBe(400)
    }
    expect(fetched).toEqual([])
  })

  test("a backslash, which the URL parser reads as a slash, is refused", async () => {
    const res = await get(["%2e%2e\\%2e%2e\\%2e%2e\\other", "x.png"])
    expect(res.status).toBe(400)
    expect(fetched).toEqual([])
  })

  test("a path that is not an image is refused", async () => {
    for (const path of [["secret.env"], ["notes"], [".hidden.png"]]) {
      expect((await get(path)).status).toBe(400)
    }
    expect(fetched).toEqual([])
  })

  test("an image is fetched from the images directory", async () => {
    const res = await get(["docker-layers.svg"])
    expect(res.status).toBe(200)
    expect(fetched).toEqual([`${PREFIX}docker-layers.svg`])
  })

  test("whatever the path, nothing is fetched from outside the images directory", async () => {
    // Built from the pieces a climb is made of, so the runs reach one often.
    const segment = fc
      .array(fc.constantFrom(".", "%2e", "%2E", "\\", "/", "a", "x.png"), {
        maxLength: 6,
        minLength: 1,
      })
      .map((pieces) => pieces.join(""))
    await fc.assert(
      fc.asyncProperty(
        fc.array(segment, { maxLength: 6, minLength: 1 }),
        async (path) => {
          fetched = []
          await get(path)
          for (const pathname of fetched) {
            expect(pathname.startsWith(PREFIX)).toBe(true)
          }
        },
      ),
      { numRuns: 300 },
    )
  })
})
