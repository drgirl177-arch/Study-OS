import { Router, type IRouter } from "express";
import { and, eq, ilike } from "drizzle-orm";
import { db, noteFoldersTable, notesTable } from "@workspace/db";
import {
  CreateNoteBody,
  CreateNoteFolderBody,
  DeleteNoteFolderParams,
  DeleteNoteParams,
  GetNoteParams,
  ListNoteFoldersResponse,
  ListNotesResponse,
  UpdateNoteBody,
  UpdateNoteParams,
} from "@workspace/api-zod";
import { requireAuth, type AuthedRequest } from "../middlewares/requireAuth";

const router: IRouter = Router();

router.get("/note-folders", requireAuth, async (req: AuthedRequest, res): Promise<void> => {
  const rows = await db
    .select()
    .from(noteFoldersTable)
    .where(eq(noteFoldersTable.clerkUserId, req.userId!));
  res.json(ListNoteFoldersResponse.parse(rows));
});

router.post("/note-folders", requireAuth, async (req: AuthedRequest, res): Promise<void> => {
  const parsed = CreateNoteFolderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [folder] = await db
    .insert(noteFoldersTable)
    .values({ clerkUserId: req.userId!, name: parsed.data.name })
    .returning();

  res.status(201).json(folder);
});

router.delete("/note-folders/:id", requireAuth, async (req: AuthedRequest, res): Promise<void> => {
  const params = DeleteNoteFolderParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [folder] = await db
    .delete(noteFoldersTable)
    .where(and(eq(noteFoldersTable.id, params.data.id), eq(noteFoldersTable.clerkUserId, req.userId!)))
    .returning();

  if (!folder) {
    res.status(404).json({ error: "Folder not found" });
    return;
  }

  res.sendStatus(204);
});

router.get("/notes", requireAuth, async (req: AuthedRequest, res): Promise<void> => {
  const folderId = typeof req.query.folderId === "string" ? parseInt(req.query.folderId, 10) : undefined;
  const search = typeof req.query.search === "string" ? req.query.search : undefined;

  const conditions = [eq(notesTable.clerkUserId, req.userId!)];
  if (folderId !== undefined && !Number.isNaN(folderId)) conditions.push(eq(notesTable.folderId, folderId));
  if (search) conditions.push(ilike(notesTable.title, `%${search}%`));

  const rows = await db.select().from(notesTable).where(and(...conditions));
  res.json(ListNotesResponse.parse(rows));
});

router.post("/notes", requireAuth, async (req: AuthedRequest, res): Promise<void> => {
  const parsed = CreateNoteBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [note] = await db
    .insert(notesTable)
    .values({
      clerkUserId: req.userId!,
      title: parsed.data.title,
      content: parsed.data.content ?? "",
      folderId: parsed.data.folderId ?? null,
    })
    .returning();

  res.status(201).json(note);
});

router.get("/notes/:id", requireAuth, async (req: AuthedRequest, res): Promise<void> => {
  const params = GetNoteParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [note] = await db
    .select()
    .from(notesTable)
    .where(and(eq(notesTable.id, params.data.id), eq(notesTable.clerkUserId, req.userId!)));

  if (!note) {
    res.status(404).json({ error: "Note not found" });
    return;
  }

  res.json(note);
});

router.patch("/notes/:id", requireAuth, async (req: AuthedRequest, res): Promise<void> => {
  const params = UpdateNoteParams.safeParse(req.params);
  const body = UpdateNoteBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: (params.error ?? body.error)!.message });
    return;
  }

  const updates: Partial<typeof notesTable.$inferInsert> = {};
  if (body.data.title !== undefined) updates.title = body.data.title;
  if (body.data.content !== undefined) updates.content = body.data.content;
  if ("folderId" in body.data) updates.folderId = body.data.folderId ?? null;

  const [note] = await db
    .update(notesTable)
    .set(updates)
    .where(and(eq(notesTable.id, params.data.id), eq(notesTable.clerkUserId, req.userId!)))
    .returning();

  if (!note) {
    res.status(404).json({ error: "Note not found" });
    return;
  }

  res.json(note);
});

router.delete("/notes/:id", requireAuth, async (req: AuthedRequest, res): Promise<void> => {
  const params = DeleteNoteParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [note] = await db
    .delete(notesTable)
    .where(and(eq(notesTable.id, params.data.id), eq(notesTable.clerkUserId, req.userId!)))
    .returning();

  if (!note) {
    res.status(404).json({ error: "Note not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
