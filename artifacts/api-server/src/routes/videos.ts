import { Router, type IRouter } from "express";
import { and, eq, ilike } from "drizzle-orm";
import { db, videosTable } from "@workspace/db";
import { GetVideoParams, ListVideosResponse } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

router.get("/videos", requireAuth, async (req, res): Promise<void> => {
  const category = typeof req.query.category === "string" ? req.query.category : undefined;
  const search = typeof req.query.search === "string" ? req.query.search : undefined;

  const conditions = [];
  if (category) conditions.push(eq(videosTable.category, category));
  if (search) conditions.push(ilike(videosTable.title, `%${search}%`));

  const rows = await db
    .select()
    .from(videosTable)
    .where(conditions.length ? and(...conditions) : undefined);

  res.json(ListVideosResponse.parse(rows));
});

router.get("/videos/:id", requireAuth, async (req, res): Promise<void> => {
  const params = GetVideoParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [video] = await db.select().from(videosTable).where(eq(videosTable.id, params.data.id));
  if (!video) {
    res.status(404).json({ error: "Video not found" });
    return;
  }

  res.json(video);
});

export default router;
