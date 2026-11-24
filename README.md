# Milestone Tracker

Track a multi-week learning sprint day by day: phases, daily tasks (learn / practice / build), notes, streaks and stats.

**Status:** in progress. See [docs/plan.md](docs/plan.md) for the roadmap.

## Stack

Node.js · Express · TypeScript · PostgreSQL · Drizzle · React · Vite · Tailwind

## Structure

```
apps/api         Express API
apps/web         React frontend
packages/shared  Zod schemas and types shared by both
docs/            plan and UI prototype
```

## Getting started

**Requirements:** Node.js 22.9+ (run `nvm use` to get the version in `.nvmrc`) and [Docker Desktop](https://www.docker.com/products/docker-desktop/).

```bash
npm install              # installs every workspace and links them together
cp .env.example .env     # then set your own POSTGRES_PASSWORD (and match it in DATABASE_URL)
npm run db:up            # starts PostgreSQL in Docker and waits until it's ready
npm run dev              # runs the API with auto-restart on save
```

## Scripts

| Command                | What it does                                     |
| ---------------------- | ------------------------------------------------ |
| `npm run dev`          | Start the API in watch mode                      |
| `npm run typecheck`    | Type-check every workspace                       |
| `npm run lint`         | Find bugs and risky patterns with ESLint         |
| `npm run format`       | Format all files with Prettier                   |
| `npm run format:check` | Check formatting without changing files (for CI) |
| `npm run db:up`        | Start the Postgres container                     |
| `npm run db:down`      | Stop it (your data is kept in a Docker volume)   |
| `npm run db:logs`      | Follow the database logs                         |
| `npm run db:psql`      | Open a SQL prompt inside the database            |
