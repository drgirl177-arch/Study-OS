import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const noteFoldersTable = pgTable("note_folders", {
  id: serial("id").primaryKey(),
  clerkUserId: text("clerk_user_id").notNull(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertNoteFolderSchema = createInsertSchema(
  noteFoldersTable,
).omit({ id: true, createdAt: true });
export type InsertNoteFolder = z.infer<typeof insertNoteFolderSchema>;
export type NoteFolder = typeof noteFoldersTable.$inferSelect;
