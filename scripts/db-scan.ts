/**
 * Dumps every page view row as JSON. Replaces `drizzle-kit studio` as the way
 * to look at what is actually stored.
 *
 * Reads the local container when `DYNAMODB_ENDPOINT` is set, and the real table
 * through the machine's AWS credential chain when it is not.
 */
import { getAllViewCounts } from "@/lib/db/queries"
import { getTableName } from "@/lib/db/schema"

const tableName = getTableName()
if (!tableName) {
  console.error("DYNAMODB_TABLE_NAME is not set. Run `mise run db:env` first.")
  process.exit(1)
}

const rows = await getAllViewCounts()

console.log(
  `${tableName} @ ${process.env.DYNAMODB_ENDPOINT ?? "AWS"} — ${rows.length} row(s)`,
)
console.log(JSON.stringify(rows, null, 2))
