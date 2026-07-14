import { Router, type IRouter } from "express";
import { and, eq, ilike } from "drizzle-orm";
import {
  db,
  materialBookmarksTable,
  materialHighlightsTable,
  materialsTable,
} from "@workspace/db";
import {
  CreateMaterialBookmarkBody,
  CreateMaterialBookmarkParams,
  CreateMaterialHighlightBody,
  CreateMaterialHighlightParams,
  DeleteMaterialBookmarkParams,
  DeleteMaterialHighlightParams,
  GetMaterialParams,
  ListMaterialBookmarksParams,
  ListMaterialBookmarksResponse,
  ListMaterialHighlightsParams,
  ListMaterialHighlightsResponse,
  ListMaterialsResponse,
} from "@workspace/api-zod";
import { requireAuth, type AuthedRequest } from "../middlewares/requireAuth";

const router: IRouter = Router();

// Public — guests can browse study materials before signing up. Bookmarks
// and highlights (personal, per-user) still require auth.
router.get("/materials", async (req, res): Promise<void> => {
  const category = typeof req.query.category === "string" ? req.query.category : undefined;
  const search = typeof req.query.search === "string" ? req.query.search : undefined;

  const conditions = [];
  if (category) conditions.push(eq(materialsTable.category, category));
  if (search) conditions.push(ilike(materialsTable.title, `%${search}%`));

  const rows = await db
    .select()
    .from(materialsTable)
    .where(conditions.length ? and(...conditions) : undefined);

  res.json(ListMaterialsResponse.parse(rows));
});

router.get("/materials/:id", async (req, res): Promise<void> => {
  const params = GetMaterialParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [material] = await db.select().from(materialsTable).where(eq(materialsTable.id, params.data.id));
  if (!material) {
    res.status(404).json({ error: "Material not found" });
    return;
  }

  res.json(material);
});

router.get("/materials/:id/bookmarks", requireAuth, async (req: AuthedRequest, res): Promise<void> => {
  const params = ListMaterialBookmarksParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const rows = await db
    .select()
    .from(materialBookmarksTable)
    .where(
      and(
        eq(materialBookmarksTable.materialId, params.data.id),
        eq(materialBookmarksTable.clerkUserId, req.userId!),
      ),
    );

  res.json(ListMaterialBookmarksResponse.parse(rows));
});

router.post("/materials/:id/bookmarks", requireAuth, async (req: AuthedRequest, res): Promise<void> => {
  const params = CreateMaterialBookmarkParams.safeParse(req.params);
  const body = CreateMaterialBookmarkBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: (params.error ?? body.error)!.message });
    return;
  }

  const [material] = await db.select().from(materialsTable).where(eq(materialsTable.id, params.data.id));
  if (!material) {
    res.status(404).json({ error: "Material not found" });
    return;
  }

  const [bookmark] = await db
    .insert(materialBookmarksTable)
    .values({
      clerkUserId: req.userId!,
      materialId: params.data.id,
      pageNumber: body.data.pageNumber,
      note: body.data.note ?? null,
    })
    .returning();

  res.status(201).json(bookmark);
});

router.delete(
  "/materials/bookmarks/:bookmarkId",
  requireAuth,
  async (req: AuthedRequest, res): Promise<void> => {
    const params = DeleteMaterialBookmarkParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    await db
      .delete(materialBookmarksTable)
      .where(
        and(
          eq(materialBookmarksTable.id, params.data.bookmarkId),
          eq(materialBookmarksTable.clerkUserId, req.userId!),
        ),
      );

    res.sendStatus(204);
  },
);

router.get("/materials/:id/highlights", requireAuth, async (req: AuthedRequest, res): Promise<void> => {
  const params = ListMaterialHighlightsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const rows = await db
    .select()
    .from(materialHighlightsTable)
    .where(
      and(
        eq(materialHighlightsTable.materialId, params.data.id),
        eq(materialHighlightsTable.clerkUserId, req.userId!),
      ),
    );

  res.json(ListMaterialHighlightsResponse.parse(rows));
});

router.post("/materials/:id/highlights", requireAuth, async (req: AuthedRequest, res): Promise<void> => {
  const params = CreateMaterialHighlightParams.safeParse(req.params);
  const body = CreateMaterialHighlightBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: (params.error ?? body.error)!.message });
    return;
  }

  const [material] = await db.select().from(materialsTable).where(eq(materialsTable.id, params.data.id));
  if (!material) {
    res.status(404).json({ error: "Material not found" });
    return;
  }

  const [highlight] = await db
    .insert(materialHighlightsTable)
    .values({
      clerkUserId: req.userId!,
      materialId: params.data.id,
      pageNumber: body.data.pageNumber,
      text: body.data.text,
      color: body.data.color,
    })
    .returning();

  res.status(201).json(highlight);
});

router.delete(
  "/materials/highlights/:highlightId",
  requireAuth,
  async (req: AuthedRequest, res): Promise<void> => {
    const params = DeleteMaterialHighlightParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    await db
      .delete(materialHighlightsTable)
      .where(
        and(
          eq(materialHighlightsTable.id, params.data.highlightId),
          eq(materialHighlightsTable.clerkUserId, req.userId!),
        ),
      );

    res.sendStatus(204);
  },
);

export default router;
