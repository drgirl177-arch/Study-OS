import { integer, pgTable, serial, text, timestamp, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { notesTable } from "./notes";

export const workspaceLayoutsTable = pgTable(
  "workspace_layouts",
  {
    id: serial("id").primaryKey(),
    clerkUserId: text("clerk_user_id").notNull(),
    contextKey: text("context_key").notNull(),
    layoutType: text("layout_type").notNull(),
    splitRatio: integer("split_ratio").notNull().default(50),
    noteId: integer("note_id").references(() => notesTable.id, {
      onDelete: "set null",
    }),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [unique().on(table.clerkUserId, table.contextKey)],
);

export const insertWorkspaceLayoutSchema = createInsertSchema(
  workspaceLayoutsTable,
).omit({ id: true, updatedAt: true });
export type InsertWorkspaceLayout = z.infer<
  typeof insertWorkspaceLayoutSchema
>;
export type WorkspaceLayout = typeof workspaceLayoutsTable.$inferSelect;
