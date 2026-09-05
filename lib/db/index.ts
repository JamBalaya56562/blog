import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb"
import { clientConfig } from "./client-config"
import { getTableName } from "./schema"

let _client: DynamoDBDocumentClient | null = null

/**
 * Returns a memoized DynamoDB document client, or `null` when there is no
 * database configured.
 *
 * `DYNAMODB_TABLE_NAME` is the single switch. Leaving it unset is a supported
 * state, not an error: unit tests, `next build` in CI, and Playwright all run
 * without a database, and every query in `./queries` degrades to a harmless
 * value rather than throwing.
 *
 * `DYNAMODB_ENDPOINT` points at a local DynamoDB container during development.
 * In Lambda it is unset, so the SDK talks to the real service and resolves
 * short-lived credentials from the execution role. No access key is involved
 * anywhere — see `./client-config` for why the local ones are not secrets.
 */
export function getDocClient(): DynamoDBDocumentClient | null {
  if (_client) {
    return _client
  }

  if (!getTableName()) {
    console.warn(
      "[getDocClient] DYNAMODB_TABLE_NAME is not set, returning null",
    )
    return null
  }

  _client = DynamoDBDocumentClient.from(new DynamoDBClient(clientConfig()), {
    marshallOptions: { removeUndefinedValues: true },
  })

  return _client
}
