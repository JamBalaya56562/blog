/**
 * DynamoDB table definition for page view tracking.
 *
 * The partition key is a constant so the whole table can be read with a single
 * `Query` instead of a `Scan`. Every item lives in one partition, which would
 * matter at scale — a partition tops out around 1000 WCU — but the table is
 * provisioned at 25 WCU to stay inside the always-free tier, so the ceiling is
 * two orders of magnitude away.
 */

export const PARTITION_KEY = "pk"
export const SORT_KEY = "slug"

/** The single partition every page view item belongs to. */
export const PARTITION_KEY_VALUE = "PAGE"

/** `count` is a DynamoDB reserved word, so expressions must alias it. */
export const COUNT_ATTRIBUTE = "count"

export type PageViewItem = {
  pk: typeof PARTITION_KEY_VALUE
  slug: string
  count: number
  /** ISO 8601. DynamoDB has no native date type. */
  updatedAt: string
}

/**
 * The table to read and write, or `undefined` when there is no database.
 *
 * Read on every call rather than captured at module load: on Lambda the value
 * comes from the function's environment at runtime, and the image is built
 * without it.
 */
export function getTableName(): string | undefined {
  return process.env.DYNAMODB_TABLE_NAME
}

/** Builds the primary key for a slug. */
export function pageViewKey(slug: string) {
  return { [PARTITION_KEY]: PARTITION_KEY_VALUE, [SORT_KEY]: slug }
}
