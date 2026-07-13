import { Router, type IRouter } from "express";
import { and, desc, eq } from "drizzle-orm";
import { db, continueWatchingTable, videosTable } from "@workspace/db";
import {
  ListContinueWatchingResponse,
  UpsertContinueWatchingBody,
  UpsertContinueWatchingParams,
} from "@workspace/api-zod";
import { requireAuth, type AuthedRequest } from "../middlewares/requireAuth";

const router: IRouter = Router();

router.get("/continue-watching", requireAuth, async (req: AuthedRequest, res): Promise<void> => {
  const rows = await db
    .select({
      videoId: continueWatchingTable.videoId,
      progressSeconds: continueWatchingTable.progressSeconds,
      lastWatchedAt: continueWatchingTable.lastWatchedAt,
      video: videosTable,
    })
    .from(continueWatchingTable)
    .innerJoin(videosTable, eq(continueWatchingTable.videoId, videosTable.id))
    .where(eq(continueWatchingTable.clerkUserId, req.userId!))
    .orderBy(desc(continueWatchingTable.lastWatchedAt));

  res.json(ListContinueWatchingResponse.parse(rows));
});

router.put(
  "/continue-watching/:videoId",
  requireAuth,
  async (req: AuthedRequest, res): Promise<void> => {
    const params = UpsertContinueWatchingParams.safeParse(req.params);
    const body = UpsertContinueWatchingBody.safeParse(req.body);
    if (!params.success || !body.success) {
      res.status(400).json({ error: (params.error ?? body.error)!.message });
      return;
    }

    const [video] = await db.select().from(videosTable).where(eq(videosTable.id, params.data.videoId));
    if (!video) {
      res.status(404).json({ error: "Video not found" });
      return;
    }

    const [row] = await db
      .insert(continueWatchingTable)
      .values({
        clerkUserId: req.userId!,
        videoId: params.data.videoId,
        progressSeconds: body.data.progressSeconds,
        lastWatchedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [continueWatchingTable.clerkUserId, continueWatchingTable.videoId],
        set: { progressSeconds: body.data.progressSeconds, lastWatchedAt: new Date() },
      })
      .returning();

    res.json({
      videoId: row!.videoId,
      video,
      progressSeconds: row!.progressSeconds,
      lastWatchedAt: row!.lastWatchedAt,
    });
  },
);

export default router;
