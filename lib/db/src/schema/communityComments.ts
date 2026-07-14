import {
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { communityPostsTable } from "./communityPosts";

export const communityCommentsTable = pgTable("community_comments", {
  id: serial("id").primaryKey(),
  postId: integer("post_id")
    .notNull()
    .references(() => communityPostsTable.id, { onDelete: "cascade" }),
  clerkUserId: text("clerk_user_id").notNull(),
  body: text("body").notNull(),
  upvoteCount: integer("upvote_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertCommunityCommentSchema = createInsertSchema(
  communityCommentsTable,
).omit({
  id: true,
  clerkUserId: true,
  upvoteCount: true,
  createdAt: true,
});
export type InsertCommunityComment = z.infer<
  typeof insertCommunityCommentSchema
>;
export type CommunityComment = typeof communityCommentsTable.$inferSelect;
