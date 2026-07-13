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
import { generateAiSenseiReply, isAiSenseiConfigured, AiSenseiError } from "../lib/aiSensei";
import { logger } from "../lib/logger";

const router: IRouter = Router();

router.get("/ai/sessions", requireAuth, async (req: AuthedRequest, res): Promise<void> => {
  try {
    const rows = await db
      .select()
      .from(aiSessionsTable)
      .where(eq(aiSessionsTable.clerkUserId, req.userId!));
    res.json(ListAiSessionsResponse.parse(rows));
  } catch (err) {
    logger.error({ err }, "Failed to list AI sessions");
    res.status(500).json({ error: "Failed to retrieve sessions" });
  }
});

router.post("/ai/sessions", requireAuth, async (req: AuthedRequest, res): Promise<void> => {
  try {
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
  } catch (err) {
    logger.error({ err }, "Failed to create AI session");
    res.status(500).json({ error: "Failed to create session" });
  }
});

router.delete("/ai/sessions/:id", requireAuth, async (req: AuthedRequest, res): Promise<void> => {
  try {
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
  } catch (err) {
    logger.error({ err }, "Failed to delete AI session");
    res.status(500).json({ error: "Failed to delete session" });
  }
});

router.get("/ai/sessions/:id/messages", requireAuth, async (req: AuthedRequest, res): Promise<void> => {
  try {
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
  } catch (err) {
    logger.error({ err }, "Failed to list AI messages");
    res.status(500).json({ error: "Failed to retrieve messages" });
  }
});

router.post("/ai/sessions/:id/messages", requireAuth, async (req: AuthedRequest, res): Promise<void> => {
  try {
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

    // Store user message
    await db.insert(aiMessagesTable).values({
      sessionId: session.id,
      role: "user",
      content: body.data.content,
    });

    // Fetch message history
    const history = await db
      .select()
      .from(aiMessagesTable)
      .where(eq(aiMessagesTable.sessionId, session.id))
      .orderBy(aiMessagesTable.createdAt);

    // Generate AI reply
    let replyText: string;
    try {
      replyText = await generateAiSenseiReply(session.mode, history);
    } catch (err) {
      if (err instanceof AiSenseiError) {
        logger.warn(
          { code: err.code, message: err.message },
          "AI Sensei error",
        );
        res.status(err.statusCode).json({ error: err.message });
        return;
      }

      logger.error({ err }, "Unexpected error during AI Sensei reply generation");
      res.status(503).json({ error: "AI Sensei is temporarily unavailable. Please try again." });
      return;
    }

    // Store AI reply
    const [reply] = await db
      .insert(aiMessagesTable)
      .values({ sessionId: session.id, role: "assistant", content: replyText })
      .returning();

    res.status(201).json(reply);
  } catch (err) {
    logger.error({ err }, "Unexpected error in send AI message endpoint");
    res.status(500).json({ error: "Failed to process message" });
  }
});

export default router;
