import { db, profilesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import type { Profile } from "@workspace/db";

const AVATAR_COLORS = ["#2563EB", "#7C3AED", "#059669", "#EA580C", "#DB2777"];

function pickAvatarColor(clerkUserId: string): string {
  let hash = 0;
  for (let i = 0; i < clerkUserId.length; i++) {
    hash = (hash * 31 + clerkUserId.charCodeAt(i)) >>> 0;
  }
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]!;
}

/** Fetches the caller's profile, creating one just-in-time on first access. */
export async function ensureProfile(clerkUserId: string): Promise<Profile> {
  const [existing] = await db
    .select()
    .from(profilesTable)
    .where(eq(profilesTable.clerkUserId, clerkUserId));

  if (existing) {
    return existing;
  }

  const [created] = await db
    .insert(profilesTable)
    .values({
      clerkUserId,
      displayName: "Student",
      avatarColor: pickAvatarColor(clerkUserId),
    })
    .onConflictDoNothing()
    .returning();

  if (created) {
    return created;
  }

  // Race with another concurrent request that created it first.
  const [row] = await db
    .select()
    .from(profilesTable)
    .where(eq(profilesTable.clerkUserId, clerkUserId));

  return row!;
}
