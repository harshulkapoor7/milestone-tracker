# Handoff from claude.ai chat (24 Nov 2026)

Context for Claude Code, so we can continue where the chat left off.

## Who I am

- Bharti: frontend dev (React, Next.js, TypeScript, Tailwind) learning backend to become full-stack.
- I want to UNDERSTAND the code, not copy it. Guide me, review my work, explain the why.
- On a MacBook (M4), VS Code, zsh. Node via nvm. Git 2.39.

## What this project is

- A personal progress tracker for a 60-day learning sprint, inspired by
  https://perryvegehan.github.io/PWP_2_Months/ (phases → days → tasks, counters, filters, backup code).
- docs/prototype.html is a working single-file version (metro-line map of 60 days, tick-off tasks,
  notes, streak, edit mode, backup code, localStorage). The real app rebuilds this as a full-stack app.
- Goal: portfolio project on GitHub, deployed online later. Same stack as my startup project RELAY,
  so the patterns here carry over.

## Decisions already made

- Stack, architecture rules and data model: see CLAUDE.md and docs/plan.md.
- Separate Express API (not Next.js API routes) so I learn backend properly.
- Sessions + httpOnly cookie for auth (not JWT).
- tasks.done_at timestamp instead of a done boolean (enables streaks/history).
- One branch + one PR per milestone; conventional commit messages.

## Working style (changed 24 Nov 2026)

- I make the decisions; Claude writes the code, runs commands, and explains each
  decision with a real-world analogy. See "How to help me" in CLAUDE.md.

## Done so far

- Installed Claude Code, fixed PATH, logged in with Claude Pro.
- Created .gitignore, CLAUDE.md, README.md, docs/plan.md, docs/prototype.html.
- First commit pushed to https://github.com/harshulkapoor7/milestone-tracker (main).
  - Git pushes use a fine-grained GitHub token (Contents: read/write, this repo only),
    saved in macOS Keychain. Remote URL includes `harshulkapoor7@` so the right account is used.
- Milestone 1 built on branch `chore/repo-setup` (merged in PR #1):
  - npm workspaces: `@milestone/api`, `@milestone/web`, `@milestone/shared` (ES modules).
  - TypeScript 6.0 (pinned `~6.0.3`; TS 7 not yet supported by typescript-eslint),
    shared `tsconfig.base.json`, `noEmit` (tsc only type-checks), `tsx watch` runs the API.
  - `packages/shared` exports TS source directly (`exports: ./src/index.ts`), has TASK_TYPES.
  - ESLint flat config with type-aware rules + Prettier (defaults), VS Code extension recs.
  - Postgres 18 (alpine) via `compose.yaml`; values from root `.env` (gitignored,
    random password); `.env.example` committed. Scripts: db:up/down/logs/psql.
  - README: getting started + scripts table.

- Milestone 2 merged in PR #2:
  - Express 5 app in `apps/api/src/app.ts` (`createApp()`, no listen → testable), started by `index.ts`.
  - `env.ts`: Zod-validated env (NODE_ENV, PORT, LOG_LEVEL, DATABASE_URL); exits on bad config.
    Loaded with Node's `--env-file-if-exists=../../.env` (no dotenv).
  - `logger.ts`: Pino; pino-pretty in dev, JSON in prod, silent in test. pino-http logs
    method/url/status only; 4xx = warn, 5xx = error.
  - `middleware/error-handler.ts`: AppError → its status; ZodError → 400; Express 4xx
    (e.g. bad JSON) → 400; anything else → 500 with a generic message (details only in logs).
  - `modules/health/`: routes → controller → service. `GET /health` → `{status, uptimeSeconds, timestamp}`.

- Milestone 3 merged in PR #3:
  - Drizzle ORM + `pg` Pool (`src/db/client.ts`, `casing: "snake_case"`). Pool has an
    `error` listener; without it a DB restart crashed the API (found by testing).
  - `src/db/schema.ts`: users, sessions, plans, phases, days, tasks. UUIDv7 ids
    (`default uuidv7()`, native in Postgres 18). `task_type` pgEnum built from shared TASK_TYPES.
    FKs cascade on delete (days.phase_id → set null). Indexes on every FK (+ position).
    `tasks.done_at` timestamptz null; CHECK minutes >= 0; unique users.email.
  - Migration `apps/api/drizzle/0000_init.sql` (committed). Generate with
    `npx drizzle-kit generate --name <name>` inside apps/api for readable names.
  - `npm run db:seed`: demo user `demo@milestone.local` (password_hash "!" = can't log in yet),
    1 plan, 4 phases, 60 days, 180 tasks, copied from the prototype. Idempotent, in a transaction.
  - `/health` now pings the DB: 200 ok / 503 degraded.

- Milestone 4 merged in PR #4:
  - Zod request schemas in `packages/shared/src/schemas.ts` (TASK_TYPES moved to
    `constants.ts` to avoid a circular import). PATCH bodies must have ≥1 field.
  - Tasks take `{ done: boolean }`; the server sets/clears `done_at`.
  - `middleware/current-user.ts` (TEMPORARY until M6): prod → 401; `x-user-id` header;
    dev falls back to demo user. Controllers use `requireUserId(req)`.
  - Modules plans/days/tasks (routes → controller → service). Ownership via joins up to
    `plans.user_id`; other users' resources → 404. New days/tasks append (max position + 1).
  - Drizzle relations added (no migration) for `GET /plans/:id` nested load.
  - Vitest + Supertest: 18 tests in `apps/api/test/`. Separate DB `milestone_tracker_test`
    (created + migrated by global-setup), tables truncated before each test, files run serially.
  - ESLint: no-unsafe-* rules off for test files only (Supertest bodies are `any`).

- Milestone 5 IN PROGRESS on branch `feat/frontend` (step 1 of ~4 done):
  - apps/web: Vite 8 + React 19 + Tailwind 4 + TanStack Query 5. `npm run dev` (root) runs
    api + web together via concurrently. Vite proxies `/api/*` → `localhost:3000/*`.
  - Response types (`Plan`, `PlanDetail`, `Task`…) in `packages/shared/src/types.ts`.
  - `src/lib/api.ts` (fetch wrapper, ApiError), `queries.ts` (usePlans, usePlan,
    useToggleTask with optimistic update + rollback), `progress.ts` (pure stats/streak).
  - UI: header, 6-stat row, collapsible day cards (today open), tickable tasks, light/dark.
  - Tailwind tokens from the prototype in `index.css` with `@theme static` (needed because
    phase colours are only referenced from JS).
  - Remaining for M5: metro-line map (SVG), phase filters + search + hide done,
    day notes, edit mode (add/rename/delete days & tasks), plan settings.

## Decisions log

- Package scope `@milestone/…` · TS runner `tsx` · ESLint + Prettier (not Biome)
- TypeScript 6 instead of 7 (tool compatibility) · Docker Desktop (not OrbStack)
- Logging: Pino (+ pino-http, pino-pretty) · ESLint: `_`-prefixed vars may be unused
- IDs: UUIDv7 (not serial integers) · Driver: `pg` (node-postgres)
- Tests: separate test DB in same container · Pre-auth: temporary current-user middleware
- Frontend → API in dev: Vite proxy (not CORS)
- Node 26 pinned in `.nvmrc` (engines >=22.9). nvm default was 18 → run `nvm use` / `nvm alias default 26`.

## Open questions for later

- Milestone 8: how the API runs in production (bundle with tsup/esbuild vs tsx/Node).
- npm blocked install scripts for esbuild and fsevents; both work without them.
- apps/web has only a package.json; Vite scaffolding happens in Milestone 5.

## Quizzes to answer (deferred to end of day, 24 Nov)

- Milestone 3: (1) Deleting a phase: what happens to its days, and why set null over cascade?
  (2) Why is the seed in a transaction? (3) Adding `phases.color`: which two commands,
  and why commit the generated file?

- Milestone 4: (1) Why does someone else's task return 404 rather than 403?
  (2) Why does the client send `{ done: true }` instead of a `doneAt` timestamp?
  (3) Why do tests use a separate `_test` database, and why are tables emptied before each test?

## Next

1. Milestone 5 step 2: metro-line map + phase legend + "Go to today".
2. Then filters/search, notes, edit mode; then PR for `feat/frontend`.
