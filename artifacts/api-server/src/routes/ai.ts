import { Router, type IRouter } from "express";
import { and, eq } from "drizzle-orm";
import { db, aiMessagesTable, aiSessionsTable } from "@workspace/db";
import {
  CreateAiSessionBody,
  DeleteAiSessionParams,
  ListAiMessagesParams,
  ListAiMessagesResponse,
  ListAiSessionsResponse,
  SendAiMessageBody,
  SendAiMessageParams,
} from "@workspace/api-zod";
import { requireAuth, type AuthedRequest } from "../middlewares/requireAuth";
import { generateAiSenseiReply, isAiSenseiConfigured } from "../lib/aiSensei";

const router: IRouter = Router();

router.get("/ai/sessions", requireAuth, async (req: AuthedRequest, res): Promise<void> => {
  const rows = await db
    .select()
    .from(aiSessionsTable)
    .where(eq(aiSessionsTable.clerkUserId, req.userId!));
  res.json(ListAiSessionsResponse.parse(rows));
});

router.post("/ai/sessions", requireAuth, async (req: AuthedRequest, res): Promise<void> => {
  const parsed = CreateAiSessionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [session] = await db
    .insert(aiSessionsTable)
    .values({ clerkUserId: req.userId!, title: parsed.data.title, mode: parsed.data.mode })
    .returning();

  res.status(201).json(session);
});

router.delete("/ai/sessions/:id", requireAuth, async (req: AuthedRequest, res): Promise<void> => {
  const params = DeleteAiSessionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [session] = await db
    .delete(aiSessionsTable)
    .where(and(eq(aiSessionsTable.id, params.data.id), eq(aiSessionsTable.clerkUserId, req.userId!)))
    .returning();

  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  res.sendStatus(204);
});

router.get("/ai/sessions/:id/messages", requireAuth, async (req: AuthedRequest, res): Promise<void> => {
  const params = ListAiMessagesParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [session] = await db
    .select()
    .from(aiSessionsTable)
    .where(and(eq(aiSessionsTable.id, params.data.id), eq(aiSessionsTable.clerkUserId, req.userId!)));
  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  const rows = await db
    .select()
    .from(aiMessagesTable)
    .where(eq(aiMessagesTable.sessionId, params.data.id))
    .orderBy(aiMessagesTable.createdAt);

  res.json(ListAiMessagesResponse.parse(rows));
});

router.post("/ai/sessions/:id/messages", requireAuth, async (req: AuthedRequest, res): Promise<void> => {
  const params = SendAiMessageParams.safeParse(req.params);
  const body = SendAiMessageBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: (params.error ?? body.error)!.message });
    return;
  }

  const [session] = await db
    .select()
    .from(aiSessionsTable)
    .where(and(eq(aiSessionsTable.id, params.data.id), eq(aiSessionsTable.clerkUserId, req.userId!)));
  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  if (!isAiSenseiConfigured()) {
    res.status(503).json({
      error: "AI Sensei is not configured. Add a Groq API key to enable AI Sensei.",
    });
    return;
  }

  await db.insert(aiMessagesTable).values({
    sessionId: session.id,
    role: "user",
    content: body.data.content,
  });

  const history = await db
    .select()
    .from(aiMessagesTable)
    .where(eq(aiMessagesTable.sessionId, session.id))
    .orderBy(aiMessagesTable.createdAt);

  let replyText: string;
  try {
    replyText = await generateAiSenseiReply(session.mode, history);
  } catch (err) {
    req.log.error({ err }, "AI Sensei reply generation failed");
    res.status(503).json({ error: "AI Sensei is temporarily unavailable. Please try again." });
    return;
  }

  const [reply] = await db
    .insert(aiMessagesTable)
    .values({ sessionId: session.id, role: "assistant", content: replyText })
    .returning();

  res.status(201).json(reply);
});

export default router;
