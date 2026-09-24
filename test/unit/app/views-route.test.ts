import { afterEach, describe, expect, mock, test } from "bun:test"

// The route's own logic sits between the request and the store: which slugs it
// lets through, whose view it records, and the shape of what it answers. The
// store is stubbed so those are what the tests see. Every export is stubbed,
// not just the two the route uses, so nothing else in the run loses one.
let stored: Map<string, number> = new Map()
let recorded: number | null = 1
const getViewCounts = mock(async (slugs: string[]) => {
  return new Map(
    slugs.flatMap((slug) =>
      stored.has(slug) ? [[slug, stored.get(slug) as number] as const] : [],
    ),
  )
})
const incrementViewCount = mock(async (_slug: string) => recorded)
mock.module("@/lib/db/queries", () => ({
  getAllViewCounts: mock(async () => []),
  getViewCounts,
  incrementViewCount,
}))

const { GET, POST } = await import("@/app/api/views/route")

const BROWSER =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36"

afterEach(() => {
  stored = new Map()
  recorded = 1
  getViewCounts.mockClear()
  incrementViewCount.mockClear()
})

function get(query: string) {
  return GET(new Request(`http://localhost/api/views${query}`))
}

function post(body: string, userAgent: string | null = BROWSER) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  }
  if (userAgent !== null) {
    headers["User-Agent"] = userAgent
  }
  return POST(
    new Request("http://localhost/api/views", {
      body,
      headers,
      method: "POST",
    }),
  )
}

describe("GET /api/views", () => {
  test("answers each counted slug, and leaves the rest out", async () => {
    stored = new Map([
      ["docker-build", 4],
      ["mise-tasks", 9],
    ])
    const res = await get("?slug=docker-build&slug=mise-tasks&slug=unseen")

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ "docker-build": 4, "mise-tasks": 9 })
    expect(getViewCounts).toHaveBeenCalledWith([
      "docker-build",
      "mise-tasks",
      "unseen",
    ])
  })

  // The count changes with every reader, so neither the browser nor
  // CloudFront may keep one. CloudFront's policy stores whatever the origin
  // allows, so the header is what keeps it out.
  test("is never stored", async () => {
    const res = await get("?slug=docker-build")
    expect(res.headers.get("Cache-Control")).toBe("no-store")
  })

  test("no slugs is an empty answer, not an error", async () => {
    const res = await get("")
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({})
  })

  test("a slug that is not a post's file name is refused before the store is asked", async () => {
    for (const slug of [
      "../x",
      "Docker",
      "a b",
      "a--b",
      "-a",
      "",
      "a".repeat(101),
    ]) {
      const res = await get(`?slug=${encodeURIComponent(slug)}`)
      expect(res.status, slug).toBe(400)
    }
    expect(getViewCounts).not.toHaveBeenCalled()
  })

  test("more slugs than any page asks for is refused", async () => {
    const query = Array.from({ length: 51 }, (_, i) => `slug=post-${i}`).join(
      "&",
    )
    const res = await get(`?${query}`)
    expect(res.status).toBe(400)
    expect(getViewCounts).not.toHaveBeenCalled()
  })
})

describe("POST /api/views", () => {
  test("records a reader's view and answers the new total", async () => {
    recorded = 5
    const res = await post(JSON.stringify({ slug: "docker-build" }))

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ count: 5 })
    expect(incrementViewCount).toHaveBeenCalledWith("docker-build")
    expect(res.headers.get("Cache-Control")).toBe("no-store")
  })

  // A crawler that renders JavaScript reaches the same effect a reader does.
  // It is answered like any other request, just without a view behind it.
  test("a crawler is answered but not counted", async () => {
    for (const userAgent of [
      "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
      null,
    ]) {
      const res = await post(
        JSON.stringify({ slug: "docker-build" }),
        userAgent,
      )
      expect(res.status).toBe(200)
      expect(await res.json()).toEqual({ count: null })
    }
    expect(incrementViewCount).not.toHaveBeenCalled()
  })

  test("a write that recorded nothing answers null, still as a 200", async () => {
    recorded = null
    const res = await post(JSON.stringify({ slug: "docker-build" }))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ count: null })
  })

  test("a body that is not JSON, or has no usable slug, is refused", async () => {
    for (const body of ["[", "null", "{}", '{"slug":3}', '{"slug":"../x"}']) {
      const res = await post(body)
      expect(res.status, body).toBe(400)
    }
    expect(incrementViewCount).not.toHaveBeenCalled()
  })
})
