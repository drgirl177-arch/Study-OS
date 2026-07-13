import { Router, type IRouter } from "express";
import { and, eq } from "drizzle-orm";
import {
  db,
  continueWatchingTable,
  studySessionsTable,
  tasksTable,
  videosTable,
} from "@workspace/db";
import { GetDashboardSummaryResponse } from "@workspace/api-zod";
import { requireAuth, type AuthedRequest } from "../middlewares/requireAuth";
import { ensureProfile } from "../lib/profile";
import { computeStreaks } from "../lib/streak";
import { toDateString } from "../lib/date";

const router: IRouter = Router();

router.get("/dashboard/summary", requireAuth, async (req: AuthedRequest, res): Promise<void> => {
  const userId = req.userId!;
  const profile = await ensureProfile(userId);
  const today = toDateString(new Date());

  const sessions = await db
    .select({ date: studySessionsTable.date, durationMinutes: studySessionsTable.durationMinutes })
    .from(studySessionsTable)
    .where(eq(studySessionsTable.clerkUserId, userId));

  const todayStudyMinutes = sessions
    .filter((s) => s.date === today)
    .reduce((sum, s) => sum + s.durationMinutes, 0);

  const { currentStreak, longestStreak } = computeStreaks(
    sessions.map((s) => s.date),
    today,
  );

  const todayTasks = await db
    .select({ completed: tasksTable.completed })
    .from(tasksTable)
    .where(and(eq(tasksTable.clerkUserId, userId), eq(tasksTable.date, today)));

  const todayTasksTotal = todayTasks.length;
  const todayTasksCompleted = todayTasks.filter((t) => t.completed).length;

  const weekAgo = new Date();
  weekAgo.setUTCDate(weekAgo.getUTCDate() - 6);
  const weekAgoIso = toDateString(weekAgo);
  const weekDaysStudied = new Set(
    sessions.filter((s) => s.date >= weekAgoIso && s.date <= today).map((s) => s.date),
  ).size;
  const weeklyProgressPercent = Math.round((weekDaysStudied / 7) * 100);

  const [continueRow] = await db
    .select({
      videoId: continueWatchingTable.videoId,
      progressSeconds: continueWatchingTable.progressSeconds,
      lastWatchedAt: continueWatchingTable.lastWatchedAt,
      video: videosTable,
    })
    .from(continueWatchingTable)
    .innerJoin(videosTable, eq(continueWatchingTable.videoId, videosTable.id))
    .where(eq(continueWatchingTable.clerkUserId, userId))
    .orderBy(continueWatchingTable.lastWatchedAt)
    .limit(1);

  let examDaysLeft: number | null = null;
  if (profile.examDate) {
    const diffMs = new Date(profile.examDate + "T00:00:00Z").getTime() - new Date(today + "T00:00:00Z").getTime();
    examDaysLeft = Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)));
  }

  res.json(
    GetDashboardSummaryResponse.parse({
      displayName: profile.displayName,
      todayStudyMinutes,
      currentStreak,
      longestStreak,
      examName: profile.examName,
      examDate: profile.examDate,
      examDaysLeft,
      continueLearning: continueRow
        ? {
            videoId: continueRow.videoId,
            video: continueRow.video,
            progressSeconds: continueRow.progressSeconds,
            lastWatchedAt: continueRow.lastWatchedAt,
          }
        : null,
      todayTasksTotal,
      todayTasksCompleted,
      weeklyProgressPercent,
    }),
  );
});

export default router;
