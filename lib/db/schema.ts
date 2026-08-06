import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core"

export const pageViews = pgTable("page_views", {
  count: integer().notNull().default(0),
  slug: text().primaryKey(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
})
