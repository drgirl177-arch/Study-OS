import { integer, pgTable, serial, text, timestamp, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { videosTable } from "./videos";

export const videoBookmarksTable = pgTable(
  "video_bookmarks",
  {
    id: serial("id").primaryKey(),
    clerkUserId: text("clerk_user_id").notNull(),
    videoId: integer("video_id")
      .notNull()
      .references(() => videosTable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [unique().on(table.clerkUserId, table.videoId)],
);

export const insertVideoBookmarkSchema = createInsertSchema(
  videoBookmarksTable,
).omit({ id: true, createdAt: true });
export type InsertVideoBookmark = z.infer<typeof insertVideoBookmarkSchema>;
export type VideoBookmark = typeof videoBookmarksTable.$inferSelect;
