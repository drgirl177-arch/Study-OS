import { Router, type IRouter } from "express";
import { and, eq, ilike } from "drizzle-orm";
import { db, videosTable } from "@workspace/db";
import { GetVideoParams, ImportYoutubeVideoBody, ListVideosResponse, SearchYoutubeVideosResponse } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";
import { isYoutubeSearchConfigured, searchYoutube, YoutubeError } from "../lib/youtube";
import { logger } from "../lib/logger";

const router: IRouter = Router();

router.get("/videos", requireAuth, async (req, res): Promise<void> => {
  const category = typeof req.query.category === "string" ? req.query.category : undefined;
  const type = typeof req.query.type === "string" ? req.query.type : undefined;
  const search = typeof req.query.search === "string" ? req.query.search : undefined;

  const conditions = [];
  if (category) conditions.push(eq(videosTable.category, category));
  if (type) conditions.push(eq(videosTable.type, type));
  if (search) conditions.push(ilike(videosTable.title, `%${search}%`));

  const rows = await db
    .select()
    .from(videosTable)
    .where(conditions.length ? and(...conditions) : undefined);

  res.json(ListVideosResponse.parse(rows));
});

// Dynamic YouTube search so students aren't limited to the curated catalog.
router.get("/videos/youtube-search", requireAuth, async (req, res): Promise<void> => {
  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
  const type = typeof req.query.type === "string" ? req.query.type : "educational";

  if (!q) {
    res.json([]);
    return;
  }

  if (!isYoutubeSearchConfigured()) {
    res.status(503).json({ error: "YouTube search is not configured yet." });
    return;
  }

  try {
    const results = await searchYoutube(q, type);
    res.json(SearchYoutubeVideosResponse.parse(results));
  } catch (err) {
    if (err instanceof YoutubeError) {
      res.status(err.status ?? 503).json({ error: err.message });
      return;
    }
    logger.error({ err }, "Unexpected error during YouTube search");
    res.status(503).json({ error: "YouTube search is temporarily unavailable." });
  }
});

// Upsert a YouTube search result into the local catalog (by youtubeId) so
// bookmarks / continue-watching / notes can reference a stable local video id.
router.post("/videos/import", requireAuth, async (req, res): Promise<void> => {
  const body = ImportYoutubeVideoBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [existing] = await db
    .select()
    .from(videosTable)
    .where(eq(videosTable.youtubeId, body.data.youtubeId));

  if (existing) {
    res.json(existing);
    return;
  }

  const category = body.data.category ?? (body.data.type === "educational" ? "NEET" : body.data.type === "motivation" ? "Motivation" : "Music");

  const [created] = await db
    .insert(videosTable)
    .values({
      youtubeId: body.data.youtubeId,
      title: body.data.title,
      channel: body.data.channel,
      category,
      type: body.data.type,
      durationSeconds: body.data.durationSeconds,
      thumbnailUrl: body.data.thumbnailUrl,
    })
    .returning();

  res.status(201).json(created);
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
