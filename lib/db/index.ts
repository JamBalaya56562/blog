import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js"
import * as schema from "./schema"

let _db: PostgresJsDatabase<typeof schema> | null = null

export function getDb(): PostgresJsDatabase<typeof schema> | null {
  if (_db) {
    return _db
  }

  const url = process.env.DATABASE_URL
  if (!url) {
    return null
  }

  _db = drizzle(url, { schema })
  return _db
}
