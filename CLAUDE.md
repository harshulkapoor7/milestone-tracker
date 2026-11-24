# Milestone Tracker

A 60-day learning-sprint tracker: phases → days → tasks, with notes, streaks and stats.
Prototype UI: docs/prototype.html. Milestones: docs/plan.md.
I'm building the real app myself to learn full-stack development.

## Stack
- Monorepo with npm workspaces: apps/api, apps/web, packages/shared
- API: Node + Express + TypeScript, Zod validation, Drizzle + PostgreSQL (Docker locally)
- Web: React + Vite + TypeScript + Tailwind + TanStack Query
- Auth: sessions stored in Postgres, httpOnly cookie
- Tests: Vitest + Supertest

## Architecture rules
- Each API module: routes → controller (HTTP only) → service (logic + DB)
- Validate every request body with Zod schemas from packages/shared
- Every query checks the resource belongs to the logged-in user
- tasks.done_at is a timestamp (null = not done), never a boolean
- Never commit .env; keep .env.example updated
- Small commits, conventional messages (feat:, fix:, chore:, docs:, test:)

## How to help me
- I'm a frontend dev learning backend. Explain the why before the code.
- Prefer hints and reviewing my code over writing whole files for me.
- When I ask for code, keep it small and walk me through it line by line.
- After each milestone, quiz me with 3 short questions on what I built.

## Current status
- Milestone: 1 (repo setup)
