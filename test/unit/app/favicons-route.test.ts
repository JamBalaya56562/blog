import { afterEach, describe, expect, mock, test } from "bun:test"
import { GET } from "@/app/api/favicons/[host]/route"

const realFetch = globalThis.fetch

afterEach(() => {
  globalThis.fetch = realFetch
})

// The route talks to the icon service through the global fetch; the test
// stands in for the service with whatever status it wants to see handled.
function upstream(status: number, body = "png") {
  const calls: string[] = []
  globalThis.fetch = mock(async (input: string | URL | Request) => {
    calls.push(String(input))
    return new Response(status === 200 ? body : null, {
      headers: status === 200 ? { "Content-Type": "image/png" } : {},
      status,
    })
  }) as unknown as typeof fetch
  return calls
}

function get(host: string) {
  return GET(new Request("http://localhost/api/favicons/x"), {
    params: Promise.resolve({ host }),
  })
}

describe("GET /api/favicons/[host]", () => {
  test("a bad host is refused before anything is fetched", async () => {
    const calls = upstream(200)
    const res = await get("github.com/../x")
    expect(res.status).toBe(400)
    expect(calls).toHaveLength(0)
  })

  test("a good host is fetched from the service and cached", async () => {
    const calls = upstream(200)
    const res = await get("github.com")
    expect(res.status).toBe(200)
    expect(res.headers.get("Content-Type")).toBe("image/png")
    expect(res.headers.get("Cache-Control")).toContain("max-age=86400")
    expect(await res.text()).toBe("png")
    expect(calls).toEqual([
      "https://www.google.com/s2/favicons?domain=github.com&sz=32",
    ])
  })

  test("an upstream 404 is a 404", async () => {
    upstream(404)
    expect((await get("github.com")).status).toBe(404)
  })

  test("any other upstream failure is a 502, not a missing icon", async () => {
    for (const status of [429, 500, 503]) {
      upstream(status)
      const res = await get("github.com")
      expect(res.status).toBe(502)
      expect(res.headers.get("Cache-Control")).toBeNull()
    }
  })

  test("a service that does not answer is a 502", async () => {
    globalThis.fetch = mock(async () => {
      throw new Error("timed out")
    }) as unknown as typeof fetch
    expect((await get("github.com")).status).toBe(502)
  })
})
