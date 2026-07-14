import { integer, pgTable, serial, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const videosTable = pgTable("videos", {
  id: serial("id").primaryKey(),
  youtubeId: text("youtube_id").notNull().unique(),
  title: text("title").notNull(),
  channel: text("channel").notNull(),
  // Exam category — only meaningful for 'educational' videos; null for motivation/music.
  category: text("category"),
  // 'educational' (Learn), 'motivation' (Motivation & Inspiration), 'music' (Study Music)
  type: text("type").notNull().default("educational"),
  durationSeconds: integer("duration_seconds").notNull(),
  thumbnailUrl: text("thumbnail_url").notNull(),
});

export const insertVideoSchema = createInsertSchema(videosTable).omit({
  id: true,
});
export type InsertVideo = z.infer<typeof insertVideoSchema>;
export type Video = typeof videosTable.$inferSelect;
