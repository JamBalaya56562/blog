import type { DynamoDBClientConfig } from "@aws-sdk/client-dynamodb"

const timeouts = {
  maxAttempts: 2,
  requestHandler: { connectionTimeout: 1000, requestTimeout: 3000 },
} satisfies DynamoDBClientConfig

export function clientConfig(): DynamoDBClientConfig {
  const endpoint = process.env.DYNAMODB_ENDPOINT

  if (!endpoint) {
    return timeouts
  }

  return {
    ...timeouts,
    credentials: { accessKeyId: "local", secretAccessKey: "local" },
    endpoint,
    region: process.env.AWS_REGION ?? "local",
  }
}
