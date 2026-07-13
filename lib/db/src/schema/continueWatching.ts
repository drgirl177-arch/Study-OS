import { integer, pgTable, serial, text, timestamp, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { videosTable } from "./videos";

export const continueWatchingTable = pgTable(
  "continue_watching",
  {
    id: serial("id").primaryKey(),
    clerkUserId: text("clerk_user_id").notNull(),
    videoId: integer("video_id")
      .notNull()
      .references(() => videosTable.id, { onDelete: "cascade" }),
    progressSeconds: integer("progress_seconds").notNull().default(0),
    lastWatchedAt: timestamp("last_watched_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [unique().on(table.clerkUserId, table.videoId)],
);

export const insertContinueWatchingSchema = createInsertSchema(
  continueWatchingTable,
).omit({ id: true });
export type InsertContinueWatching = z.infer<
  typeof insertContinueWatchingSchema
>;
export type ContinueWatching = typeof continueWatchingTable.$inferSelect;
