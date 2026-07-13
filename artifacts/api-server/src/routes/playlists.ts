import { Router, type IRouter } from "express";
import { and, eq } from "drizzle-orm";
import { db, playlistItemsTable, playlistsTable, videosTable } from "@workspace/db";
import {
  AddPlaylistItemBody,
  AddPlaylistItemParams,
  CreatePlaylistBody,
  DeletePlaylistParams,
  GetPlaylistParams,
  ListPlaylistsResponse,
  RemovePlaylistItemParams,
} from "@workspace/api-zod";
import { requireAuth, type AuthedRequest } from "../middlewares/requireAuth";

const router: IRouter = Router();

router.get("/playlists", requireAuth, async (req: AuthedRequest, res): Promise<void> => {
  const rows = await db
    .select()
    .from(playlistsTable)
    .where(eq(playlistsTable.clerkUserId, req.userId!));

  const counts = await db
    .select({ playlistId: playlistItemsTable.playlistId })
    .from(playlistItemsTable);

  const countMap = new Map<number, number>();
  for (const c of counts) countMap.set(c.playlistId, (countMap.get(c.playlistId) ?? 0) + 1);

  res.json(
    ListPlaylistsResponse.parse(
      rows.map((r) => ({ ...r, itemCount: countMap.get(r.id) ?? 0 })),
    ),
  );
});

router.post("/playlists", requireAuth, async (req: AuthedRequest, res): Promise<void> => {
  const parsed = CreatePlaylistBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [playlist] = await db
    .insert(playlistsTable)
    .values({ clerkUserId: req.userId!, name: parsed.data.name })
    .returning();

  res.status(201).json({ ...playlist, itemCount: 0 });
});

router.get("/playlists/:id", requireAuth, async (req: AuthedRequest, res): Promise<void> => {
  const params = GetPlaylistParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [playlist] = await db
    .select()
    .from(playlistsTable)
    .where(and(eq(playlistsTable.id, params.data.id), eq(playlistsTable.clerkUserId, req.userId!)));

  if (!playlist) {
    res.status(404).json({ error: "Playlist not found" });
    return;
  }

  const items = await db
    .select({ video: videosTable })
    .from(playlistItemsTable)
    .innerJoin(videosTable, eq(playlistItemsTable.videoId, videosTable.id))
    .where(eq(playlistItemsTable.playlistId, playlist.id));

  res.json({ ...playlist, videos: items.map((i) => i.video) });
});

router.delete("/playlists/:id", requireAuth, async (req: AuthedRequest, res): Promise<void> => {
  const params = DeletePlaylistParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [playlist] = await db
    .delete(playlistsTable)
    .where(and(eq(playlistsTable.id, params.data.id), eq(playlistsTable.clerkUserId, req.userId!)))
    .returning();

  if (!playlist) {
    res.status(404).json({ error: "Playlist not found" });
    return;
  }

  res.sendStatus(204);
});

router.post("/playlists/:id/items", requireAuth, async (req: AuthedRequest, res): Promise<void> => {
  const params = AddPlaylistItemParams.safeParse(req.params);
  const body = AddPlaylistItemBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: (params.error ?? body.error)!.message });
    return;
  }

  const [playlist] = await db
    .select()
    .from(playlistsTable)
    .where(and(eq(playlistsTable.id, params.data.id), eq(playlistsTable.clerkUserId, req.userId!)));
  if (!playlist) {
    res.status(404).json({ error: "Playlist not found" });
    return;
  }

  const [video] = await db.select().from(videosTable).where(eq(videosTable.id, body.data.videoId));
  if (!video) {
    res.status(404).json({ error: "Video not found" });
    return;
  }

  await db
    .insert(playlistItemsTable)
    .values({ playlistId: playlist.id, videoId: body.data.videoId })
    .onConflictDoNothing();

  const items = await db
    .select({ video: videosTable })
    .from(playlistItemsTable)
    .innerJoin(videosTable, eq(playlistItemsTable.videoId, videosTable.id))
    .where(eq(playlistItemsTable.playlistId, playlist.id));

  res.status(201).json({ ...playlist, videos: items.map((i) => i.video) });
});

router.delete(
  "/playlists/:id/items/:videoId",
  requireAuth,
  async (req: AuthedRequest, res): Promise<void> => {
    const params = RemovePlaylistItemParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const [playlist] = await db
      .select()
      .from(playlistsTable)
      .where(and(eq(playlistsTable.id, params.data.id), eq(playlistsTable.clerkUserId, req.userId!)));
    if (!playlist) {
      res.status(404).json({ error: "Playlist not found" });
      return;
    }

    await db
      .delete(playlistItemsTable)
      .where(
        and(
          eq(playlistItemsTable.playlistId, params.data.id),
          eq(playlistItemsTable.videoId, params.data.videoId),
        ),
      );

    res.sendStatus(204);
  },
);

export default router;
