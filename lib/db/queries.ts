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
    console.error("[getViewCount] failed for slug:", slug, describe(e))
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
    console.error("[incrementViewCount] failed for slug:", slug, describe(e))
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
    console.error("[getViewCounts] failed for slugs:", slugs, describe(e))
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
    console.error("[getAllViewCounts] failed:", describe(e))
    return []
  }
}
