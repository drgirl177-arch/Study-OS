import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, notesTable, playlistsTable, studySessionsTable, tasksTable } from "@workspace/db";
import { ListAchievementsResponse } from "@workspace/api-zod";
import { requireAuth, type AuthedRequest } from "../middlewares/requireAuth";
import { computeStreaks } from "../lib/streak";
import { toDateString } from "../lib/date";

const router: IRouter = Router();

router.get("/achievements", requireAuth, async (req: AuthedRequest, res): Promise<void> => {
  const userId = req.userId!;

  const sessions = await db
    .select()
    .from(studySessionsTable)
    .where(eq(studySessionsTable.clerkUserId, userId));
  const { currentStreak, longestStreak } = computeStreaks(
    sessions.map((s) => s.date),
    toDateString(new Date()),
  );
  const totalMinutes = sessions.reduce((sum, s) => sum + s.durationMinutes, 0);

  const completedTasks = (
    await db.select().from(tasksTable).where(eq(tasksTable.clerkUserId, userId))
  ).filter((t) => t.completed).length;

  const noteCount = (await db.select().from(notesTable).where(eq(notesTable.clerkUserId, userId))).length;
  const playlistCount = (
    await db.select().from(playlistsTable).where(eq(playlistsTable.clerkUserId, userId))
  ).length;

  const achievements = [
    {
      id: "first-session",
      title: "First Steps",
      description: "Log your first study session",
      achieved: sessions.length >= 1,
    },
    {
      id: "three-day-streak",
      title: "On a Roll",
      description: "Study 3 days in a row",
      achieved: currentStreak >= 3 || longestStreak >= 3,
    },
    {
      id: "seven-day-streak",
      title: "Week Warrior",
      description: "Study 7 days in a row",
      achieved: currentStreak >= 7 || longestStreak >= 7,
    },
    {
      id: "ten-hours",
      title: "Deep Focus",
      description: "Accumulate 10 hours of study time",
      achieved: totalMinutes >= 600,
    },
    {
      id: "task-master",
      title: "Task Master",
      description: "Complete 10 tasks",
      achieved: completedTasks >= 10,
    },
    {
      id: "note-taker",
      title: "Note Taker",
      description: "Create 5 notes",
      achieved: noteCount >= 5,
    },
    {
      id: "curator",
      title: "Curator",
      description: "Create your first playlist",
      achieved: playlistCount >= 1,
    },
  ].map((a) => ({ ...a, achievedAt: a.achieved ? new Date() : null }));

  res.json(ListAchievementsResponse.parse(achievements));
});

export default router;
