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
- I make the decisions; Claude writes the code and runs the commands.
- Before a real choice (library, structure, trade-off), give me the options with a
  recommendation and let me decide. Don't ask about trivial defaults.
- After writing code, explain each decision with a real-world analogy, walking
  through it line by line, so I understand what everything does.
- After each milestone, quiz me with 3 short questions on what I built.

## Current status

- Milestones 1–4 done (merged). Next: Milestone 5 (frontend)
