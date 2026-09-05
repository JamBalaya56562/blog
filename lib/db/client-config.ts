import type { DynamoDBClientConfig } from "@aws-sdk/client-dynamodb"

/**
 * Builds the SDK configuration for both the app and the `db:*` scripts.
 *
 * There are deliberately no long-lived access keys anywhere in this project:
 *
 * - On Lambda, nothing is configured here. The SDK's default credential chain
 *   picks up short-lived credentials from the function's execution role.
 * - In GitHub Actions, the same chain picks up the credentials the OIDC role
 *   assumption exported.
 * - Against a developer's real AWS account, the chain reads whatever the
 *   machine already has, so `aws sso login` with an IAM Identity Center profile
 *   works without this project storing anything.
 * - Against the local container, the SDK still has to sign requests, so it is
 *   given the throwaway pair below. DynamoDB Local accepts any signature and,
 *   with `-sharedDb`, ignores which key it came from. These are placeholders,
 *   not credentials, and they grant nothing.
 *
 * Passing the local credentials explicitly rather than through `.env` also
 * keeps `AWS_ACCESS_KEY_ID` out of the environment, where it would otherwise
 * shadow a developer's real SSO session for every other AWS tool in the shell.
 */
/**
 * Bounds how long a page render can wait on the database.
 *
 * Without these, an unreachable endpoint does not fail — it hangs. A stopped
 * local container leaves its published port bound, so connections stall
 * instead of being refused, and the SDK's defaults let a single request sit for
 * minutes. That turns the graceful degradation in `./queries` into a hung page.
 * DynamoDB answers in single-digit milliseconds, so these limits are generous
 * while capping the worst case at a few seconds.
 */
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
    // DynamoDB Local ignores the region, but the SDK refuses to build a request
    // without one, and a developer may have no AWS config at all.
    region: process.env.AWS_REGION ?? "local",
  }
}
