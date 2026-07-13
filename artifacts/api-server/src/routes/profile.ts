import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, profilesTable } from "@workspace/db";
import { GetProfileResponse, UpdateProfileBody, UpdateProfileResponse } from "@workspace/api-zod";
import { requireAuth, type AuthedRequest } from "../middlewares/requireAuth";
import { ensureProfile } from "../lib/profile";
import { toDateString } from "../lib/date";

const router: IRouter = Router();

router.get("/profile", requireAuth, async (req: AuthedRequest, res): Promise<void> => {
  const profile = await ensureProfile(req.userId!);
  res.json(
    GetProfileResponse.parse({
      displayName: profile.displayName,
      examName: profile.examName,
      examDate: profile.examDate,
      avatarColor: profile.avatarColor,
    }),
  );
});

router.patch("/profile", requireAuth, async (req: AuthedRequest, res): Promise<void> => {
  const parsed = UpdateProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  await ensureProfile(req.userId!);

  const updates: Partial<typeof profilesTable.$inferInsert> = {};
  if (parsed.data.displayName !== undefined) updates.displayName = parsed.data.displayName;
  if (parsed.data.avatarColor !== undefined) updates.avatarColor = parsed.data.avatarColor;
  if ("examName" in parsed.data) updates.examName = parsed.data.examName ?? null;
  if ("examDate" in parsed.data) {
    updates.examDate = parsed.data.examDate ? toDateString(parsed.data.examDate) : null;
  }

  const [updated] = await db
    .update(profilesTable)
    .set(updates)
    .where(eq(profilesTable.clerkUserId, req.userId!))
    .returning();

  res.json(
    UpdateProfileResponse.parse({
      displayName: updated!.displayName,
      examName: updated!.examName,
      examDate: updated!.examDate,
      avatarColor: updated!.avatarColor,
    }),
  );
});

export default router;
