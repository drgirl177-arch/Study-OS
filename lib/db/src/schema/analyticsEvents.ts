import { jsonb, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const analyticsEventsTable = pgTable("analytics_events", {
  id: serial("id").primaryKey(),
  // Nullable — guests generate events too, before they have a clerkUserId.
  clerkUserId: text("clerk_user_id"),
  // A client-generated id (stored in localStorage) so we can trace a guest's
  // journey across events even before they sign up.
  anonId: text("anon_id"),
  name: text("name").notNull(),
  path: text("path"),
  properties: jsonb("properties"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertAnalyticsEventSchema = createInsertSchema(
  analyticsEventsTable,
).omit({
  id: true,
  clerkUserId: true,
  createdAt: true,
});
export type InsertAnalyticsEvent = z.infer<typeof insertAnalyticsEventSchema>;
export type AnalyticsEvent = typeof analyticsEventsTable.$inferSelect;
