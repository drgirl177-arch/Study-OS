import {
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// A single upvote table for both posts and comments. `targetType` +
// `targetId` identify what was voted on; the unique index below ensures one
// vote per user per target (no FK to two tables at once, so integrity for
// targetId is enforced at the application layer in the route handlers).
export const communityVotesTable = pgTable(
  "community_votes",
  {
    id: serial("id").primaryKey(),
    targetType: text("target_type").notNull(), // "post" | "comment"
    targetId: integer("target_id").notNull(),
    clerkUserId: text("clerk_user_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("community_votes_target_user_idx").on(
      table.targetType,
      table.targetId,
      table.clerkUserId,
    ),
  ],
);

export type CommunityVote = typeof communityVotesTable.$inferSelect;
