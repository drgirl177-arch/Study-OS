import { Router, type IRouter } from "express";
import { and, desc, eq, sql } from "drizzle-orm";
import {
  db,
  communityCommentsTable,
  communityPostsTable,
  communityVotesTable,
  profilesTable,
} from "@workspace/db";
import {
  CreateCommunityCommentBody,
  CreateCommunityPostBody,
  DeleteCommunityPostParams,
  GetCommunityPostParams,
  ListCommunityCommentsParams,
  UpvoteCommunityCommentParams,
  UpvoteCommunityPostParams,
} from "@workspace/api-zod";
import { requireAuth, type AuthedRequest } from "../middlewares/requireAuth";

const router: IRouter = Router();

async function getAuthorMap(clerkUserIds: string[]) {
  if (clerkUserIds.length === 0) return new Map<string, { displayName: string; avatarColor: string }>();
  const unique = [...new Set(clerkUserIds)];
  const rows = await db.select().from(profilesTable);
  const map = new Map<string, { displayName: string; avatarColor: string }>();
  for (const id of unique) {
    const profile = rows.find((r) => r.clerkUserId === id);
    map.set(id, {
      displayName: profile?.displayName ?? "GROFO Student",
      avatarColor: profile?.avatarColor ?? "#2563EB",
    });
  }
  return map;
}

async function votedTargetIds(targetType: string, targetIds: number[], userId: string) {
  if (targetIds.length === 0) return new Set<number>();
  const votes = await db
    .select()
    .from(communityVotesTable)
    .where(
      and(
        eq(communityVotesTable.targetType, targetType),
        eq(communityVotesTable.clerkUserId, userId),
      ),
    );
  return new Set(votes.filter((v) => targetIds.includes(v.targetId)).map((v) => v.targetId));
}

router.get("/community/posts", requireAuth, async (req: AuthedRequest, res): Promise<void> => {
  const category = typeof req.query.category === "string" ? req.query.category : undefined;

  const rows = await db
    .select()
    .from(communityPostsTable)
    .where(category ? eq(communityPostsTable.category, category) : undefined)
    .orderBy(desc(communityPostsTable.createdAt));

  const authorMap = await getAuthorMap(rows.map((r) => r.clerkUserId));
  const voted = await votedTargetIds("post", rows.map((r) => r.id), req.userId!);

  res.json(
    rows.map((r) => ({
      ...r,
      authorName: authorMap.get(r.clerkUserId)!.displayName,
      authorAvatarColor: authorMap.get(r.clerkUserId)!.avatarColor,
      hasUpvoted: voted.has(r.id),
      isOwnPost: r.clerkUserId === req.userId,
    })),
  );
});

router.post("/community/posts", requireAuth, async (req: AuthedRequest, res): Promise<void> => {
  const body = CreateCommunityPostBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [created] = await db
    .insert(communityPostsTable)
    .values({
      clerkUserId: req.userId!,
      category: body.data.category,
      title: body.data.title,
      body: body.data.body,
    })
    .returning();

  const authorMap = await getAuthorMap([req.userId!]);
  res.status(201).json({
    ...created,
    authorName: authorMap.get(req.userId!)!.displayName,
    authorAvatarColor: authorMap.get(req.userId!)!.avatarColor,
    hasUpvoted: false,
    isOwnPost: true,
  });
});

router.get("/community/posts/:id", requireAuth, async (req: AuthedRequest, res): Promise<void> => {
  const params = GetCommunityPostParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [post] = await db.select().from(communityPostsTable).where(eq(communityPostsTable.id, params.data.id));
  if (!post) {
    res.status(404).json({ error: "Post not found" });
    return;
  }

  const authorMap = await getAuthorMap([post.clerkUserId]);
  const voted = await votedTargetIds("post", [post.id], req.userId!);

  res.json({
    ...post,
    authorName: authorMap.get(post.clerkUserId)!.displayName,
    authorAvatarColor: authorMap.get(post.clerkUserId)!.avatarColor,
    hasUpvoted: voted.has(post.id),
    isOwnPost: post.clerkUserId === req.userId,
  });
});

router.delete("/community/posts/:id", requireAuth, async (req: AuthedRequest, res): Promise<void> => {
  const params = DeleteCommunityPostParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db
    .delete(communityPostsTable)
    .where(and(eq(communityPostsTable.id, params.data.id), eq(communityPostsTable.clerkUserId, req.userId!)))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Post not found" });
    return;
  }

  res.sendStatus(204);
});

router.post("/community/posts/:id/upvote", requireAuth, async (req: AuthedRequest, res): Promise<void> => {
  const params = UpvoteCommunityPostParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [post] = await db.select().from(communityPostsTable).where(eq(communityPostsTable.id, params.data.id));
  if (!post) {
    res.status(404).json({ error: "Post not found" });
    return;
  }

  const [existingVote] = await db
    .select()
    .from(communityVotesTable)
    .where(
      and(
        eq(communityVotesTable.targetType, "post"),
        eq(communityVotesTable.targetId, params.data.id),
        eq(communityVotesTable.clerkUserId, req.userId!),
      ),
    );

  let hasUpvoted: boolean;
  if (existingVote) {
    await db.delete(communityVotesTable).where(eq(communityVotesTable.id, existingVote.id));
    hasUpvoted = false;
  } else {
    await db.insert(communityVotesTable).values({
      targetType: "post",
      targetId: params.data.id,
      clerkUserId: req.userId!,
    });
    hasUpvoted = true;
  }

  const [updated] = await db
    .update(communityPostsTable)
    .set({ upvoteCount: sql`${communityPostsTable.upvoteCount} + ${hasUpvoted ? 1 : -1}` })
    .where(eq(communityPostsTable.id, params.data.id))
    .returning();

  const authorMap = await getAuthorMap([updated!.clerkUserId]);
  res.json({
    ...updated,
    authorName: authorMap.get(updated!.clerkUserId)!.displayName,
    authorAvatarColor: authorMap.get(updated!.clerkUserId)!.avatarColor,
    hasUpvoted,
    isOwnPost: updated!.clerkUserId === req.userId,
  });
});

router.get(
  "/community/posts/:id/comments",
  requireAuth,
  async (req: AuthedRequest, res): Promise<void> => {
    const params = ListCommunityCommentsParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const rows = await db
      .select()
      .from(communityCommentsTable)
      .where(eq(communityCommentsTable.postId, params.data.id))
      .orderBy(communityCommentsTable.createdAt);

    const authorMap = await getAuthorMap(rows.map((r) => r.clerkUserId));
    const voted = await votedTargetIds("comment", rows.map((r) => r.id), req.userId!);

    res.json(
      rows.map((r) => ({
        ...r,
        authorName: authorMap.get(r.clerkUserId)!.displayName,
        authorAvatarColor: authorMap.get(r.clerkUserId)!.avatarColor,
        hasUpvoted: voted.has(r.id),
        isOwnComment: r.clerkUserId === req.userId,
      })),
    );
  },
);

router.post(
  "/community/posts/:id/comments",
  requireAuth,
  async (req: AuthedRequest, res): Promise<void> => {
    const params = ListCommunityCommentsParams.safeParse(req.params);
    const body = CreateCommunityCommentBody.safeParse(req.body);
    if (!params.success || !body.success) {
      res.status(400).json({ error: (params.error ?? body.error)!.message });
      return;
    }

    const [post] = await db.select().from(communityPostsTable).where(eq(communityPostsTable.id, params.data.id));
    if (!post) {
      res.status(404).json({ error: "Post not found" });
      return;
    }

    const [created] = await db
      .insert(communityCommentsTable)
      .values({ postId: params.data.id, clerkUserId: req.userId!, body: body.data.body })
      .returning();

    await db
      .update(communityPostsTable)
      .set({ commentCount: sql`${communityPostsTable.commentCount} + 1` })
      .where(eq(communityPostsTable.id, params.data.id));

    const authorMap = await getAuthorMap([req.userId!]);
    res.status(201).json({
      ...created,
      authorName: authorMap.get(req.userId!)!.displayName,
      authorAvatarColor: authorMap.get(req.userId!)!.avatarColor,
      hasUpvoted: false,
      isOwnComment: true,
    });
  },
);

router.post(
  "/community/comments/:id/upvote",
  requireAuth,
  async (req: AuthedRequest, res): Promise<void> => {
    const params = UpvoteCommunityCommentParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const [comment] = await db
      .select()
      .from(communityCommentsTable)
      .where(eq(communityCommentsTable.id, params.data.id));
    if (!comment) {
      res.status(404).json({ error: "Comment not found" });
      return;
    }

    const [existingVote] = await db
      .select()
      .from(communityVotesTable)
      .where(
        and(
          eq(communityVotesTable.targetType, "comment"),
          eq(communityVotesTable.targetId, params.data.id),
          eq(communityVotesTable.clerkUserId, req.userId!),
        ),
      );

    let hasUpvoted: boolean;
    if (existingVote) {
      await db.delete(communityVotesTable).where(eq(communityVotesTable.id, existingVote.id));
      hasUpvoted = false;
    } else {
      await db.insert(communityVotesTable).values({
        targetType: "comment",
        targetId: params.data.id,
        clerkUserId: req.userId!,
      });
      hasUpvoted = true;
    }

    const [updated] = await db
      .update(communityCommentsTable)
      .set({ upvoteCount: sql`${communityCommentsTable.upvoteCount} + ${hasUpvoted ? 1 : -1}` })
      .where(eq(communityCommentsTable.id, params.data.id))
      .returning();

    const authorMap = await getAuthorMap([updated!.clerkUserId]);
    res.json({
      ...updated,
      authorName: authorMap.get(updated!.clerkUserId)!.displayName,
      authorAvatarColor: authorMap.get(updated!.clerkUserId)!.avatarColor,
      hasUpvoted,
      isOwnComment: updated!.clerkUserId === req.userId,
    });
  },
);

export default router;
