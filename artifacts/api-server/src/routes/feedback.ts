import { Router, type IRouter } from "express";
import { db, feedbackTable } from "@workspace/db";
import { SubmitFeedbackBody } from "@workspace/api-zod";
import { requireAuth, type AuthedRequest } from "../middlewares/requireAuth";
import { logger } from "../lib/logger";

const router: IRouter = Router();

router.post("/feedback", requireAuth, async (req: AuthedRequest, res): Promise<void> => {
  const body = SubmitFeedbackBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [created] = await db
    .insert(feedbackTable)
    .values({
      clerkUserId: req.userId!,
      type: body.data.type,
      message: body.data.message,
      page: body.data.page ?? null,
    })
    .returning();

  logger.info({ type: body.data.type, page: body.data.page }, "Beta feedback received");
  res.status(201).json(created);
});

export default router;
