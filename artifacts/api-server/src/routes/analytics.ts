import { Router, type IRouter } from "express";
import { db, analyticsEventsTable } from "@workspace/db";
import { TrackAnalyticsEventBody } from "@workspace/api-zod";
import { optionalAuth, type OptionallyAuthedRequest } from "../middlewares/optionalAuth";
import { logger } from "../lib/logger";

const router: IRouter = Router();

// Public — guests generate events (page views, video plays, sign-up CTA
// clicks) before they have an account, so this cannot require auth.
router.post("/analytics/events", optionalAuth, async (req: OptionallyAuthedRequest, res): Promise<void> => {
  const body = TrackAnalyticsEventBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  try {
    await db.insert(analyticsEventsTable).values({
      clerkUserId: req.userId ?? null,
      anonId: body.data.anonId ?? null,
      name: body.data.name,
      path: body.data.path ?? null,
      properties: body.data.properties ?? null,
    });
  } catch (err) {
    // Analytics must never break the app — log and swallow.
    logger.warn({ err }, "Failed to record analytics event");
  }

  res.sendStatus(204);
});

export default router;
