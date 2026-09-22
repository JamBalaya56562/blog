import {
  BatchGetCommand,
  GetCommand,
  QueryCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb"
import { getDocClient } from "."
import {
  COUNT_ATTRIBUTE,
  getTableName,
  PARTITION_KEY,
  PARTITION_KEY_VALUE,
  type PageViewItem,
  pageViewKey,
} from "./schema"

const BATCH_GET_LIMIT = 100
const MAX_BATCH_ATTEMPTS = 4

function describe(e: unknown): string {
  if (e instanceof AggregateError) {
    return `${e.name}: ${e.errors.map((inner) => inner?.message).join("; ")}`
  }
  return e instanceof Error ? `${e.name}: ${e.message}` : String(e)
}

/** How long one cause stays quiet after it has been reported. */
const REPORT_INTERVAL_MS = 5 * 60 * 1000

const lastReported = new Map<string, number>()

/**
 * Reports a failure once per cause, then keeps quiet about it for a while.
 *
 * Every query below swallows its error and falls back to an empty count: a
 * view counter is not worth a broken page. That leaves the log as the only
 * trace, and a log nobody can read is no trace at all — with no database
 * configured, as in the end-to-end run, the same refused connection arrives
 * on every request and buries whatever else the run had to say.
 *
 * The cause is the function and the error's own description, so the first
 * report of each carries its slug and the rest of the same cause are
 * dropped; a different failure still gets through at once. After the
 * interval a cause reports again, so an outage that returns next week is not
 * silenced by one from today.
 */
function report(where: string, e: unknown, subject?: string): void {
  const message = describe(e)
  const key = `${where}: ${message}`
  const now = Date.now()
  const last = lastReported.get(key)
  if (last !== undefined && now - last < REPORT_INTERVAL_MS) {
    return
  }

  lastReported.set(key, now)
  console.error(
    subject === undefined
      ? `[${where}] failed: ${message}`
      : `[${where}] failed for ${subject}: ${message}`,
  )
}

export async function getViewCount(slug: string): Promise<number> {
  const client = getDocClient()
  if (!client) {
    return 0
  }

  try {
    const result = await client.send(
      new GetCommand({ Key: pageViewKey(slug), TableName: getTableName() }),
    )

    return (result.Item as PageViewItem | undefined)?.count ?? 0
  } catch (e) {
    report("getViewCount", e, `slug ${slug}`)
    return 0
  }
}

export async function incrementViewCount(slug: string): Promise<number | null> {
  const client = getDocClient()
  if (!client) {
    return null
  }

  try {
    const result = await client.send(
      new UpdateCommand({
        ExpressionAttributeNames: { "#count": COUNT_ATTRIBUTE },
        ExpressionAttributeValues: {
          ":now": new Date().toISOString(),
          ":one": 1,
        },
        Key: pageViewKey(slug),
        ReturnValues: "UPDATED_NEW",
        TableName: getTableName(),
        UpdateExpression: "SET updatedAt = :now ADD #count :one",
      }),
    )

    const count = result.Attributes?.count
    return typeof count === "number" ? count : null
  } catch (e) {
    report("incrementViewCount", e, `slug ${slug}`)
    return null
  }
}

export async function getViewCounts(
  slugs: string[],
): Promise<Map<string, number>> {
  const client = getDocClient()
  const tableName = getTableName()
  const counts = new Map<string, number>()

  if (!client || !tableName || slugs.length === 0) {
    return counts
  }

  try {
    const unique = [...new Set(slugs)]

    for (let i = 0; i < unique.length; i += BATCH_GET_LIMIT) {
      let keys: Record<string, unknown>[] = unique
        .slice(i, i + BATCH_GET_LIMIT)
        .map((slug) => pageViewKey(slug))

      for (
        let attempt = 0;
        keys.length > 0 && attempt < MAX_BATCH_ATTEMPTS;
        attempt++
      ) {
        const result = await client.send(
          new BatchGetCommand({
            RequestItems: { [tableName]: { Keys: keys } },
          }),
        )

        for (const item of (result.Responses?.[tableName] ??
          []) as PageViewItem[]) {
          counts.set(item.slug, item.count)
        }

        keys = result.UnprocessedKeys?.[tableName]?.Keys ?? []
      }
    }

    return counts
  } catch (e) {
    report("getViewCounts", e, `slugs ${slugs.join(", ")}`)
    return new Map()
  }
}

export async function getAllViewCounts(): Promise<
  { slug: string; count: number; updatedAt: Date }[]
> {
  const client = getDocClient()
  if (!client) {
    return []
  }

  try {
    const items: PageViewItem[] = []
    let cursor: Record<string, unknown> | undefined

    do {
      const result = await client.send(
        new QueryCommand({
          ExclusiveStartKey: cursor,
          ExpressionAttributeValues: { ":pk": PARTITION_KEY_VALUE },
          KeyConditionExpression: `${PARTITION_KEY} = :pk`,
          TableName: getTableName(),
        }),
      )

      items.push(...((result.Items ?? []) as PageViewItem[]))
      cursor = result.LastEvaluatedKey
    } while (cursor)

    return items
      .sort((a, b) => b.count - a.count)
      .map((item) => ({
        count: item.count,
        slug: item.slug,
        updatedAt: new Date(item.updatedAt),
      }))
  } catch (e) {
    report("getAllViewCounts", e)
    return []
  }
}
