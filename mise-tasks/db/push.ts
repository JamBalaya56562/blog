#!/usr/bin/env bun
//MISE description="Create the DynamoDB table if it does not exist"
/**
 * Creates the page views table if it does not exist. Replaces `drizzle-kit push`.
 *
 * The same script provisions the local container and the real AWS table — only
 * the environment differs. With `DYNAMODB_ENDPOINT` set it talks to the local
 * container; without it, it uses the machine's normal AWS credential chain, so
 * `DYNAMODB_ENDPOINT= AWS_PROFILE=... mise run db:push` creates the production
 * table: the empty override reaches the script as an empty string, which the
 * client config treats as "no endpoint".
 */
import {
  CreateTableCommand,
  DescribeTableCommand,
  DynamoDBClient,
  ResourceNotFoundException,
  waitUntilTableExists,
} from "@aws-sdk/client-dynamodb"
import { clientConfig } from "@/lib/db/client-config"
import { getTableName, PARTITION_KEY, SORT_KEY } from "@/lib/db/schema"

const tableName = getTableName()
if (!tableName) {
  console.error(
    "DYNAMODB_TABLE_NAME is not set. It comes from `[env]` in mise.toml, so run this through `mise run`.",
  )
  process.exit(1)
}

const client = new DynamoDBClient(clientConfig())
const target = process.env.DYNAMODB_ENDPOINT ?? "AWS"

try {
  await client.send(new DescribeTableCommand({ TableName: tableName }))
  console.log(
    `Table "${tableName}" already exists on ${target} — nothing to do.`,
  )
  process.exit(0)
} catch (e) {
  if (!(e instanceof ResourceNotFoundException)) {
    throw e
  }
}

console.log(`Creating table "${tableName}" on ${target}...`)

await client.send(
  new CreateTableCommand({
    AttributeDefinitions: [
      { AttributeName: PARTITION_KEY, AttributeType: "S" },
      { AttributeName: SORT_KEY, AttributeType: "S" },
    ],
    KeySchema: [
      { AttributeName: PARTITION_KEY, KeyType: "HASH" },
      { AttributeName: SORT_KEY, KeyType: "RANGE" },
    ],
    // Provisioned, not on-demand: provisioned capacity is in the always-free
    // tier up to 25 read and 25 write units, while on-demand request pricing is
    // not. Five of each is still tens of times more than this blog needs, and
    // it leaves the rest of the account's free allowance for other tables.
    // DynamoDB Local ignores these numbers.
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5,
    },
    TableName: tableName,
  }),
)

await waitUntilTableExists(
  { client, maxWaitTime: 120 },
  { TableName: tableName },
)

console.log(`Table "${tableName}" is ready.`)
