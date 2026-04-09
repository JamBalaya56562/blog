import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core"

export const pageViews = pgTable("page_views", {
  slug: text().primaryKey(),
  count: integer().notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
})
