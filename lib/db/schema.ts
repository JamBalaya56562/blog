export const PARTITION_KEY = "pk"
export const SORT_KEY = "slug"
export const PARTITION_KEY_VALUE = "PAGE"
export const COUNT_ATTRIBUTE = "count"

export type PageViewItem = {
  pk: typeof PARTITION_KEY_VALUE
  slug: string
  count: number
  updatedAt: string
}

export function getTableName(): string | undefined {
  return process.env.DYNAMODB_TABLE_NAME
}

export function pageViewKey(slug: string) {
  return { [PARTITION_KEY]: PARTITION_KEY_VALUE, [SORT_KEY]: slug }
}
