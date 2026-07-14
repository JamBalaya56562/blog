import { describe, expect, mock, test } from "bun:test"

// Mock getDb to return a fake Drizzle query builder
const mockGetDb = mock()
mock.module("@/lib/db", () => ({
  getDb: mockGetDb,
}))

const { getViewCount, incrementViewCount } = await import("@/lib/db/queries")

describe("getViewCount", () => {
  test("returns 0 when db is unavailable", async () => {
    mockGetDb.mockReturnValue(null)
    const count = await getViewCount("test-slug")
    expect(count).toBe(0)
  })

  test("returns 0 when slug is not found", async () => {
    const limitMock = mock(() => Promise.resolve([]))
    const whereMock = mock(() => ({ limit: limitMock }))
    const fromMock = mock(() => ({ where: whereMock }))
    const selectMock = mock(() => ({ from: fromMock }))
    mockGetDb.mockReturnValue({ select: selectMock })

    const count = await getViewCount("non-existent")
    expect(count).toBe(0)
  })

  test("returns count when slug exists", async () => {
    const limitMock = mock(() => Promise.resolve([{ count: 42 }]))
    const whereMock = mock(() => ({ limit: limitMock }))
    const fromMock = mock(() => ({ where: whereMock }))
    const selectMock = mock(() => ({ from: fromMock }))
    mockGetDb.mockReturnValue({ select: selectMock })

    const count = await getViewCount("popular-post")
    expect(count).toBe(42)
  })
})

describe("incrementViewCount", () => {
  test("does nothing when db is unavailable", async () => {
    mockGetDb.mockReturnValue(null)
    // Should not throw
    await incrementViewCount("test-slug")
  })

  test("calls insert with upsert when db is available", async () => {
    const onConflictDoUpdateMock = mock(() => Promise.resolve())
    const valuesMock = mock((_values: { slug: string; count: number }) => ({
      onConflictDoUpdate: onConflictDoUpdateMock,
    }))
    const insertMock = mock(() => ({ values: valuesMock }))
    mockGetDb.mockReturnValue({ insert: insertMock })

    await incrementViewCount("my-post")

    expect(insertMock).toHaveBeenCalledTimes(1)
    expect(valuesMock).toHaveBeenCalledTimes(1)
    expect(valuesMock.mock.calls[0][0]).toEqual({ slug: "my-post", count: 1 })
    expect(onConflictDoUpdateMock).toHaveBeenCalledTimes(1)
  })
})
