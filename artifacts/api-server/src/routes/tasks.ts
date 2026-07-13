import { Router, type IRouter } from "express";
import { and, eq } from "drizzle-orm";
import { db, tasksTable } from "@workspace/db";
import {
  CreateTaskBody,
  DeleteTaskParams,
  ListTasksResponse,
  UpdateTaskBody,
  UpdateTaskParams,
} from "@workspace/api-zod";
import { requireAuth, type AuthedRequest } from "../middlewares/requireAuth";
import { toDateString, parseDateParam } from "../lib/date";

const router: IRouter = Router();

router.get("/tasks", requireAuth, async (req: AuthedRequest, res): Promise<void> => {
  const startDate = parseDateParam(req.query.startDate);
  const endDate = parseDateParam(req.query.endDate);

  const conditions = [eq(tasksTable.clerkUserId, req.userId!)];
  if (startDate) conditions.push(eq(tasksTable.date, startDate) as any);

  let rows = await db
    .select()
    .from(tasksTable)
    .where(eq(tasksTable.clerkUserId, req.userId!))
    .orderBy(tasksTable.date);

  if (startDate) rows = rows.filter((r) => r.date >= startDate);
  if (endDate) rows = rows.filter((r) => r.date <= endDate);

  res.json(ListTasksResponse.parse(rows));
});

router.post("/tasks", requireAuth, async (req: AuthedRequest, res): Promise<void> => {
  const parsed = CreateTaskBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [task] = await db
    .insert(tasksTable)
    .values({
      clerkUserId: req.userId!,
      title: parsed.data.title,
      date: toDateString(parsed.data.date),
      priority: parsed.data.priority ?? "medium",
    })
    .returning();

  res.status(201).json(task);
});

router.patch("/tasks/:id", requireAuth, async (req: AuthedRequest, res): Promise<void> => {
  const params = UpdateTaskParams.safeParse(req.params);
  const body = UpdateTaskBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: (params.error ?? body.error)!.message });
    return;
  }

  const updates: Partial<typeof tasksTable.$inferInsert> = {};
  if (body.data.title !== undefined) updates.title = body.data.title;
  if (body.data.date !== undefined) updates.date = toDateString(body.data.date);
  if (body.data.completed !== undefined) updates.completed = body.data.completed;
  if (body.data.priority !== undefined) updates.priority = body.data.priority;

  const [task] = await db
    .update(tasksTable)
    .set(updates)
    .where(and(eq(tasksTable.id, params.data.id), eq(tasksTable.clerkUserId, req.userId!)))
    .returning();

  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }

  res.json(task);
});

router.delete("/tasks/:id", requireAuth, async (req: AuthedRequest, res): Promise<void> => {
  const params = DeleteTaskParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [task] = await db
    .delete(tasksTable)
    .where(and(eq(tasksTable.id, params.data.id), eq(tasksTable.clerkUserId, req.userId!)))
    .returning();

  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
