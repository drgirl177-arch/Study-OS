import type { NextFunction, Request, Response } from "express";
import { getAuth } from "@clerk/express";

export interface OptionallyAuthedRequest extends Request {
  userId?: string;
}

/**
 * Like requireAuth, but never rejects — attaches req.userId when a session
 * is present and lets the request through either way. Used for endpoints
 * that guests may hit (e.g. catalog browsing, analytics events) but that
 * still want to know who the user is when they're signed in.
 */
export function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const auth = getAuth(req);
  const userId = auth?.sessionClaims?.userId || auth?.userId;
  if (userId) {
    (req as OptionallyAuthedRequest).userId = userId as string;
  }
  next();
}
