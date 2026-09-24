import { afterEach, describe, expect, mock, test } from "bun:test"
import { createHash } from "node:crypto"
import { fetchViewCounts, recordView } from "@/lib/views/client"
import { stubGlobals } from "../../stub-global"

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

  // CloudFront signs the request to the function with SigV4, which covers the
  // body's hash, and it cannot hash a streamed body itself: without this
  // header the function refuses the POST. Checked against Node's own SHA-256
  // of the exact bytes sent, not against the code under test.
  test("sends the SHA-256 of the exact body it posts", async () => {
    const calls = api(() => Response.json({ count: 1 }))

    await recordView("getting-started-with-mise")

    const init = calls[0].init
    const body = String(init?.body)
    const headers = new Headers(init?.headers)
    expect(headers.get("x-amz-content-sha256")).toBe(
      createHash("sha256").update(body).digest("hex"),
    )
  })

  // Plain HTTP from anything but localhost has no `crypto.subtle`. There is
  // no CloudFront there to need the header, so the view still goes out.
  test("without crypto.subtle it posts without the header", async () => {
    const restore = stubGlobals({ crypto: {} })
    try {
      const calls = api(() => Response.json({ count: 2 }))

      expect(await recordView("docker-build")).toBe(2)
      expect(
        new Headers(calls[0].init?.headers).has("x-amz-content-sha256"),
      ).toBe(false)
    } finally {
      restore()
    }
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
