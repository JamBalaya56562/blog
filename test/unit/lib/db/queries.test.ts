import { beforeEach, describe, expect, mock, test } from "bun:test"

// The queries read the table name from the environment on every call, so it has
// to be set before the module under test is imported.
process.env.DYNAMODB_TABLE_NAME = "test-page-views"

// Mock the client factory rather than the AWS SDK: it is the same module
// boundary the Drizzle version mocked, and it keeps the commands real so the
// assertions below check the input the SDK would actually send.
const mockGetDocClient = mock()
mock.module("@/lib/db", () => ({
  getDocClient: mockGetDocClient,
}))

const { getAllViewCounts, getViewCount, getViewCounts, incrementViewCount } =
  await import("@/lib/db/queries")

/** Stands in for the document client, resolving each `send` in order. */
function fakeClient(...responses: unknown[]) {
  const send = mock(() => Promise.resolve(responses.shift() ?? {}))
  mockGetDocClient.mockReturnValue({ send })
  return send
}

/** Reads the command input of the nth `send` call. */
// biome-ignore lint/suspicious/noExplicitAny: test helper reaching into a mock
function inputOf(send: any, n = 0): any {
  return send.mock.calls[n][0].input
}

function failingClient() {
  const send = mock(() => Promise.reject(new Error("boom")))
  mockGetDocClient.mockReturnValue({ send })
  return send
}

beforeEach(() => {
  mockGetDocClient.mockReset()
})

describe("getViewCount", () => {
  test("returns 0 when db is unavailable", async () => {
    mockGetDocClient.mockReturnValue(null)
    expect(await getViewCount("test-slug")).toBe(0)
  })

  test("returns 0 when slug is not found", async () => {
    fakeClient({})
    expect(await getViewCount("non-existent")).toBe(0)
  })

  test("returns count when slug exists", async () => {
    const send = fakeClient({ Item: { count: 42, slug: "popular-post" } })

    expect(await getViewCount("popular-post")).toBe(42)
    expect(inputOf(send)).toMatchObject({
      Key: { pk: "PAGE", slug: "popular-post" },
      TableName: "test-page-views",
    })
  })

  test("returns 0 when the read fails", async () => {
    failingClient()
    expect(await getViewCount("popular-post")).toBe(0)
  })
})

describe("incrementViewCount", () => {
  test("returns null when db is unavailable", async () => {
    mockGetDocClient.mockReturnValue(null)
    expect(await incrementViewCount("test-slug")).toBeNull()
  })

  test("atomically adds one and returns the new count", async () => {
    const send = fakeClient({ Attributes: { count: 8 } })

    expect(await incrementViewCount("my-post")).toBe(8)

    const input = inputOf(send)
    expect(input.Key).toEqual({ pk: "PAGE", slug: "my-post" })
    expect(input.UpdateExpression).toBe("SET updatedAt = :now ADD #count :one")
    expect(input.ExpressionAttributeNames).toEqual({ "#count": "count" })
    expect(input.ExpressionAttributeValues[":one"]).toBe(1)
    expect(input.ReturnValues).toBe("UPDATED_NEW")
  })

  test("returns null when the write fails", async () => {
    failingClient()
    // A number here would overwrite the rendered figure with an invented one.
    expect(await incrementViewCount("my-post")).toBeNull()
  })
})

describe("getViewCounts", () => {
  test("returns an empty map when db is unavailable", async () => {
    mockGetDocClient.mockReturnValue(null)
    expect(await getViewCounts(["a"])).toEqual(new Map())
  })

  test("returns an empty map for an empty slug list without querying", async () => {
    const send = fakeClient()
    expect(await getViewCounts([])).toEqual(new Map())
    expect(send).not.toHaveBeenCalled()
  })

  test("maps found slugs and omits missing ones", async () => {
    const send = fakeClient({
      Responses: {
        "test-page-views": [
          { count: 3, slug: "a" },
          { count: 7, slug: "b" },
        ],
      },
    })

    const counts = await getViewCounts(["a", "b", "missing"])

    expect(counts.get("a")).toBe(3)
    expect(counts.get("b")).toBe(7)
    expect(counts.has("missing")).toBe(false)
    expect(inputOf(send).RequestItems["test-page-views"].Keys).toHaveLength(3)
  })

  test("retries the keys DynamoDB could not process", async () => {
    const send = fakeClient(
      {
        Responses: { "test-page-views": [{ count: 1, slug: "a" }] },
        UnprocessedKeys: {
          "test-page-views": { Keys: [{ pk: "PAGE", slug: "b" }] },
        },
      },
      { Responses: { "test-page-views": [{ count: 2, slug: "b" }] } },
    )

    const counts = await getViewCounts(["a", "b"])

    expect(send).toHaveBeenCalledTimes(2)
    expect(counts.get("b")).toBe(2)
  })

  test("returns an empty map when the read fails", async () => {
    failingClient()
    expect(await getViewCounts(["a"])).toEqual(new Map())
  })
})

describe("getAllViewCounts", () => {
  test("returns an empty array when db is unavailable", async () => {
    mockGetDocClient.mockReturnValue(null)
    expect(await getAllViewCounts()).toEqual([])
  })

  test("sorts by count descending", async () => {
    fakeClient({
      Items: [
        { count: 5, slug: "middle", updatedAt: "2026-01-01T00:00:00.000Z" },
        { count: 9, slug: "top", updatedAt: "2026-01-02T00:00:00.000Z" },
        { count: 1, slug: "bottom", updatedAt: "2026-01-03T00:00:00.000Z" },
      ],
    })

    const rows = await getAllViewCounts()

    expect(rows.map((r) => r.slug)).toEqual(["top", "middle", "bottom"])
    expect(rows[0].updatedAt).toBeInstanceOf(Date)
  })

  test("follows pagination until the cursor is exhausted", async () => {
    const send = fakeClient(
      {
        Items: [{ count: 1, slug: "a", updatedAt: "2026-01-01T00:00:00.000Z" }],
        LastEvaluatedKey: { pk: "PAGE", slug: "a" },
      },
      {
        Items: [{ count: 2, slug: "b", updatedAt: "2026-01-01T00:00:00.000Z" }],
      },
    )

    const rows = await getAllViewCounts()

    expect(send).toHaveBeenCalledTimes(2)
    expect(rows.map((r) => r.slug)).toEqual(["b", "a"])
  })

  test("returns an empty array when the query fails", async () => {
    failingClient()
    expect(await getAllViewCounts()).toEqual([])
  })
})
