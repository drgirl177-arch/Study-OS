import { Router, type IRouter } from "express";
import { and, eq } from "drizzle-orm";
import { db, videoBookmarksTable, videosTable } from "@workspace/db";
import {
  CreateBookmarkBody,
  DeleteBookmarkParams,
  ListBookmarksResponse,
} from "@workspace/api-zod";
import { requireAuth, type AuthedRequest } from "../middlewares/requireAuth";

const router: IRouter = Router();

router.get("/bookmarks", requireAuth, async (req: AuthedRequest, res): Promise<void> => {
  const rows = await db
    .select({ video: videosTable })
    .from(videoBookmarksTable)
    .innerJoin(videosTable, eq(videoBookmarksTable.videoId, videosTable.id))
    .where(eq(videoBookmarksTable.clerkUserId, req.userId!));

  res.json(ListBookmarksResponse.parse(rows.map((r) => r.video)));
});

router.post("/bookmarks", requireAuth, async (req: AuthedRequest, res): Promise<void> => {
  const parsed = CreateBookmarkBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [video] = await db.select().from(videosTable).where(eq(videosTable.id, parsed.data.videoId));
  if (!video) {
    res.status(404).json({ error: "Video not found" });
    return;
  }

  await db
    .insert(videoBookmarksTable)
    .values({ clerkUserId: req.userId!, videoId: parsed.data.videoId })
    .onConflictDoNothing();

  res.status(201).json(video);
});

router.delete("/bookmarks/:videoId", requireAuth, async (req: AuthedRequest, res): Promise<void> => {
  const params = DeleteBookmarkParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  await db
    .delete(videoBookmarksTable)
    .where(
      and(
        eq(videoBookmarksTable.clerkUserId, req.userId!),
        eq(videoBookmarksTable.videoId, params.data.videoId),
      ),
    );

  res.sendStatus(204);
});

export default router;
