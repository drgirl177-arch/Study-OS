# GROFO

A personal Learning Operating System for Indian competitive-exam students (NEET, JEE, CLAT, UPSC, Languages) — replaces scattered YouTube/notes/PDF/timer/chat apps with one calm, focused study command center.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server
- `pnpm --filter @workspace/grofo run dev` — run the GROFO web frontend
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `node scripts/seed-grofo.mjs` (run from repo root, needs `DATABASE_URL`) — idempotently seeds the `videos` and `materials` catalog tables with real YouTube IDs and real NCERT PDF URLs
- Required env: `DATABASE_URL`, `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`, `VITE_CLERK_PUBLISHABLE_KEY` (all already provisioned)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite (`artifacts/grofo`), wouter routing, TanStack Query, Tailwind v4
- Auth: Clerk (Replit-managed tenant), not Replit Auth, not Firebase
- API: Express 5 (`artifacts/api-server`)
- DB: PostgreSQL + Drizzle ORM (`lib/db`)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from `lib/api-spec/openapi.yaml`) → `lib/api-client-react`, `lib/api-zod`
- AI Sensei chat: plain `openai` npm SDK pointed at Groq's OpenAI-compatible endpoint (`https://api.groq.com/openai/v1`, model `llama-3.3-70b-versatile`), reading `process.env.GROQ_API_KEY` directly (no Replit AI Integrations proxy — see Gotchas)

## Where things live

- `lib/api-spec/openapi.yaml` — source of truth for the whole API surface
- `lib/db/src/schema/` — one Drizzle table per file (profiles, tasks, studySessions, videos, continueWatching, videoBookmarks, playlists, playlistItems, noteFolders, notes, materials, materialBookmarks, materialHighlights, workspaceLayouts, aiSessions, aiMessages)
- `artifacts/api-server/src/routes/` — one router file per domain, all mounted in `routes/index.ts`
- `artifacts/api-server/src/lib/aiSensei.ts` — AI Sensei reply generation + `isAiSenseiConfigured()`
- `artifacts/api-server/src/middlewares/requireAuth.ts` — Clerk-based auth middleware, sets `req.userId`
- `artifacts/grofo/src/` — frontend pages/components (built by the design subagent)
- `scripts/seed-grofo.mjs` — one-off idempotent catalog seed script (plain `pg`, no ORM, run standalone)

## Architecture decisions

- Auth is Clerk (Replit-managed), chosen over Replit Auth/Firebase per user's explicit request.
- Profiles are created just-in-time (`ensureProfile` in `artifacts/api-server/src/lib/profile.ts`) on first authenticated request rather than via a signup webhook — simpler for v0.1, no missed-webhook edge cases.
- Streaks are computed on the fly from the `study_sessions` log (`computeStreaks` in `src/lib/streak.ts`), not stored — avoids drift between stored streak counters and actual session history.
- Achievements are computed on the fly from existing tables (sessions, tasks, notes, playlists) rather than stored — no achievements table, no risk of stale "achieved" flags.
- Video catalog and PDF materials are curated/seeded, not user-uploaded — v0.1 has no object storage/upload pipeline.
- `videos.type` (`educational` | `motivation` | `music`) splits the Learn page into three tabs while keeping one shared catalog table (bookmarks/continue-watching/playlists keep working across all three). `category` stays as the subject filter, only meaningful for `educational`.
- Learn also supports live YouTube search (`GET /videos/youtube-search`, server-side via `YOUTUBE_API_KEY` so the key never reaches the browser) alongside the local catalog. Picking a live result calls `POST /videos/import` to upsert it into `videos` (by `youtubeId`) before opening it, so the rest of the app only ever deals with local video ids.
- Workspace split-screen layout preference is keyed by a client-generated `contextKey` string (e.g. `video:12`, `material:5`) rather than a foreign key, since the same layout system spans videos, PDFs, notes, and AI chat.

## Product

- Bottom nav: Home (dashboard/streak/continue-learning), Learn (video catalog, playlists, bookmarks), Planner (tasks + manual/Pomodoro timers), AI (AI Sensei chat), Profile (settings, dark mode, achievements).
- Study Workspace: split-screen combos (Video+Notes, Video+PDF, PDF+Notes, AI+PDF, AI+Notes) with persisted layout/split ratio per context.
- Notes with autosave, PDF viewer with bookmarks/highlights, AI Sensei chat with explain/doubt/summarize/quiz modes.

## User preferences

- Primary color `#2563EB`, white background, full dark mode, rounded UI corners, Android-first mobile web layout with bottom nav.
- No emojis anywhere in the UI.

## Gotchas

- **AI Sensei runs on Groq, not OpenAI.** The managed OpenAI proxy (`setupReplitAIIntegrations`) failed with `awaiting_account_upgrade`, so AI Sensei uses the `openai` SDK pointed at Groq's OpenAI-compatible base URL (`https://api.groq.com/openai/v1`, model `llama-3.3-70b-versatile`) with `process.env.GROQ_API_KEY`. `POST /ai/sessions/:id/messages` returns `503` with a friendly error if the key is missing — the frontend shows this inline with a retry option. `GROQ_API_KEY` is set and verified working.
- The Clerk sign-in/sign-up card header currently reads "Study OS" instead of "GROFO" — this is the Clerk application's display name set during initial provisioning (before the project was named GROFO), not app code. Cosmetic only; rename via Clerk dashboard if it matters.
- `ListTasksQueryParams`/date-range query params are validated manually (`parseDateParam`) rather than via the generated Zod schema, because Orval generated `zod.date()` (not `zod.coerce.date()`) for those two query fields, which fails on the raw string query params Express receives.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
