import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, studySessionsTable } from "@workspace/db";
import {
  CreateStudySessionBody,
  GetWeeklyStudySessionsResponse,
} from "@workspace/api-zod";
import { requireAuth, type AuthedRequest } from "../middlewares/requireAuth";
import { toDateString } from "../lib/date";

const router: IRouter = Router();

router.post("/study-sessions", requireAuth, async (req: AuthedRequest, res): Promise<void> => {
  const parsed = CreateStudySessionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [session] = await db
    .insert(studySessionsTable)
    .values({
      clerkUserId: req.userId!,
      durationMinutes: parsed.data.durationMinutes,
      source: parsed.data.source,
      date: toDateString(new Date()),
    })
    .returning();

  res.status(201).json(session);
});

router.get("/study-sessions/weekly", requireAuth, async (req: AuthedRequest, res): Promise<void> => {
  const rows = await db
    .select()
    .from(studySessionsTable)
    .where(eq(studySessionsTable.clerkUserId, req.userId!));

  const today = new Date();
  const byDate = new Map<string, number>();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - i);
    byDate.set(toDateString(d), 0);
  }
  for (const row of rows) {
    if (byDate.has(row.date)) {
      byDate.set(row.date, byDate.get(row.date)! + row.durationMinutes);
    }
  }

  res.json(
    GetWeeklyStudySessionsResponse.parse(
      Array.from(byDate.entries()).map(([date, minutes]) => ({ date, minutes })),
    ),
  );
});

export default router;
