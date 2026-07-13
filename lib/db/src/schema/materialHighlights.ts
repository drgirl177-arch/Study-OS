import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { materialsTable } from "./materials";

export const materialHighlightsTable = pgTable("material_highlights", {
  id: serial("id").primaryKey(),
  clerkUserId: text("clerk_user_id").notNull(),
  materialId: integer("material_id")
    .notNull()
    .references(() => materialsTable.id, { onDelete: "cascade" }),
  pageNumber: integer("page_number").notNull(),
  text: text("text").notNull(),
  color: text("color").notNull().default("#FDE68A"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertMaterialHighlightSchema = createInsertSchema(
  materialHighlightsTable,
).omit({ id: true, createdAt: true });
export type InsertMaterialHighlight = z.infer<
  typeof insertMaterialHighlightSchema
>;
export type MaterialHighlight = typeof materialHighlightsTable.$inferSelect;
