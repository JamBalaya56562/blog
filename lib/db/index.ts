import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb"
import { clientConfig } from "./client-config"
import { getTableName } from "./schema"

let _client: DynamoDBDocumentClient | null = null

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
