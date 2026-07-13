import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { materialsTable } from "./materials";

export const materialBookmarksTable = pgTable("material_bookmarks", {
  id: serial("id").primaryKey(),
  clerkUserId: text("clerk_user_id").notNull(),
  materialId: integer("material_id")
    .notNull()
    .references(() => materialsTable.id, { onDelete: "cascade" }),
  pageNumber: integer("page_number").notNull(),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertMaterialBookmarkSchema = createInsertSchema(
  materialBookmarksTable,
).omit({ id: true, createdAt: true });
export type InsertMaterialBookmark = z.infer<
  typeof insertMaterialBookmarkSchema
>;
export type MaterialBookmark = typeof materialBookmarksTable.$inferSelect;
