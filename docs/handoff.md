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

- Milestone 2 built on branch `feat/api-skeleton`:
  - Express 5 app in `apps/api/src/app.ts` (`createApp()`, no listen → testable), started by `index.ts`.
  - `env.ts`: Zod-validated env (NODE_ENV, PORT, LOG_LEVEL, DATABASE_URL); exits on bad config.
    Loaded with Node's `--env-file-if-exists=../../.env` (no dotenv).
  - `logger.ts`: Pino; pino-pretty in dev, JSON in prod, silent in test. pino-http logs
    method/url/status only; 4xx = warn, 5xx = error.
  - `middleware/error-handler.ts`: AppError → its status; ZodError → 400; Express 4xx
    (e.g. bad JSON) → 400; anything else → 500 with a generic message (details only in logs).
  - `modules/health/`: routes → controller → service. `GET /health` → `{status, uptimeSeconds, timestamp}`.

## Decisions log

- Package scope `@milestone/…` · TS runner `tsx` · ESLint + Prettier (not Biome)
- TypeScript 6 instead of 7 (tool compatibility) · Docker Desktop (not OrbStack)
- Logging: Pino (+ pino-http, pino-pretty) · ESLint: `_`-prefixed vars may be unused

## Open questions for later

- Milestone 8: how the API runs in production (bundle with tsup/esbuild vs tsx/Node).
- npm blocked install scripts for esbuild and fsevents; both work without them.
- apps/web has only a package.json; Vite scaffolding happens in Milestone 5.

## Next

1. Open + merge the PR for `feat/api-skeleton`, tick Milestone 2 in docs/plan.md.
2. Milestone 3 (database): Drizzle schema (users, sessions, plans, phases, days, tasks),
   first migration, seed script for the 60-day plan. Add a DB ping to the health service.
