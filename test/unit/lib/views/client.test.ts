import { afterEach, describe, expect, mock, test } from "bun:test"
import { fetchViewCounts, recordView } from "@/lib/views/client"

const realFetch = globalThis.fetch

afterEach(() => {
  globalThis.fetch = realFetch
})

// Stands in for /api/views: records what was asked and answers as told.
function api(respond: () => Response | Promise<Response>) {
  const calls: { url: string; init?: RequestInit }[] = []
  globalThis.fetch = mock(
    async (input: string | URL | Request, init?: RequestInit) => {
      calls.push({ init, url: String(input) })
      return respond()
    },
  ) as unknown as typeof fetch
  return calls
}

describe("recordView", () => {
  test("posts the slug as JSON and returns the new total", async () => {
    const calls = api(() => Response.json({ count: 7 }))

    expect(await recordView("docker-build")).toBe(7)
    expect(calls).toHaveLength(1)
    expect(calls[0].url).toBe("/api/views")
    expect(calls[0].init?.method).toBe("POST")
    expect(JSON.parse(String(calls[0].init?.body))).toEqual({
      slug: "docker-build",
    })
  })

  // The counter falls back to another figure in every one of these, so none
  // of them may throw at it.
  test("nothing recorded, a refused request and a lost connection all come back null", async () => {
    api(() => Response.json({ count: null }))
    expect(await recordView("docker-build")).toBeNull()

    api(() => Response.json({ error: "invalid slug" }, { status: 400 }))
    expect(await recordView("docker-build")).toBeNull()

    api(() => {
      throw new TypeError("Failed to fetch")
    })
    expect(await recordView("docker-build")).toBeNull()
  })
})

describe("fetchViewCounts", () => {
  test("asks for every slug in one request", async () => {
    const calls = api(() => Response.json({ "docker-build": 4 }))

    expect(await fetchViewCounts(["docker-build", "mise-tasks"])).toEqual({
      "docker-build": 4,
    })
    expect(calls).toHaveLength(1)
    const url = new URL(calls[0].url, "http://localhost")
    expect(url.pathname).toBe("/api/views")
    expect(url.searchParams.getAll("slug")).toEqual([
      "docker-build",
      "mise-tasks",
    ])
  })

  test("no slugs asks nothing", async () => {
    const calls = api(() => Response.json({}))
    expect(await fetchViewCounts([])).toEqual({})
    expect(calls).toHaveLength(0)
  })

  // What a failure means is the caller's to decide — the provider settles on
  // "no counts" — so it has to be told there was one.
  test("a failed request rejects rather than answering no counts", async () => {
    api(() => new Response("", { status: 500 }))
    await expect(fetchViewCounts(["docker-build"])).rejects.toThrow("500")
  })
})
