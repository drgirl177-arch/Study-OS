import { Router, type IRouter } from "express";
import { and, eq } from "drizzle-orm";
import { db, workspaceLayoutsTable } from "@workspace/db";
import {
  GetWorkspaceLayoutParams,
  SaveWorkspaceLayoutBody,
  SaveWorkspaceLayoutParams,
} from "@workspace/api-zod";
import { requireAuth, type AuthedRequest } from "../middlewares/requireAuth";

const router: IRouter = Router();

router.get(
  "/workspace-layout/:contextKey",
  requireAuth,
  async (req: AuthedRequest, res): Promise<void> => {
    const params = GetWorkspaceLayoutParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const [layout] = await db
      .select()
      .from(workspaceLayoutsTable)
      .where(
        and(
          eq(workspaceLayoutsTable.clerkUserId, req.userId!),
          eq(workspaceLayoutsTable.contextKey, params.data.contextKey),
        ),
      );

    if (!layout) {
      res.status(404).json({ error: "No saved layout for this context" });
      return;
    }

    res.json(layout);
  },
);

router.put(
  "/workspace-layout/:contextKey",
  requireAuth,
  async (req: AuthedRequest, res): Promise<void> => {
    const params = SaveWorkspaceLayoutParams.safeParse(req.params);
    const body = SaveWorkspaceLayoutBody.safeParse(req.body);
    if (!params.success || !body.success) {
      res.status(400).json({ error: (params.error ?? body.error)!.message });
      return;
    }

    const [layout] = await db
      .insert(workspaceLayoutsTable)
      .values({
        clerkUserId: req.userId!,
        contextKey: params.data.contextKey,
        layoutType: body.data.layoutType,
        splitRatio: body.data.splitRatio,
        noteId: body.data.noteId ?? null,
      })
      .onConflictDoUpdate({
        target: [workspaceLayoutsTable.clerkUserId, workspaceLayoutsTable.contextKey],
        set: {
          layoutType: body.data.layoutType,
          splitRatio: body.data.splitRatio,
          noteId: body.data.noteId ?? null,
        },
      })
      .returning();

    res.json(layout);
  },
);

export default router;
