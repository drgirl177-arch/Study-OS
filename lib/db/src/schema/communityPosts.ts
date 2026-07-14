import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// exam | motivation | productivity | doubts | general
export const communityPostsTable = pgTable("community_posts", {
  id: serial("id").primaryKey(),
  clerkUserId: text("clerk_user_id").notNull(),
  category: text("category").notNull().default("general"),
  title: text("title").notNull(),
  body: text("body").notNull(),
  upvoteCount: integer("upvote_count").notNull().default(0),
  commentCount: integer("comment_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertCommunityPostSchema = createInsertSchema(
  communityPostsTable,
).omit({
  id: true,
  clerkUserId: true,
  upvoteCount: true,
  commentCount: true,
  createdAt: true,
});
export type InsertCommunityPost = z.infer<typeof insertCommunityPostSchema>;
export type CommunityPost = typeof communityPostsTable.$inferSelect;
