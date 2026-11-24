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
npm run db:migrate       # creates the tables
npm run db:seed          # demo user: demo@milestone.local / milestone-demo
npm run dev              # runs the API (:3000) and the web app (:5173) together
```

## API

Log in with a session cookie (`httpOnly`, `SameSite=Lax`). Every route except
`/health` and `/auth/*` needs it, and only ever returns your own data.
After `npm run db:seed` you can log in as **demo@milestone.local / milestone-demo**
(local development only).

| Method | Path                               | What it does                                               |
| ------ | ---------------------------------- | ---------------------------------------------------------- |
| GET    | `/health`                          | Server + database status                                   |
| POST   | `/auth/register`                   | Create an account (starts with the 60-day plan) and log in |
| POST   | `/auth/login`                      | Log in: sets the session cookie                            |
| POST   | `/auth/logout`                     | Log out: deletes the session                               |
| GET    | `/me`                              | The logged-in user                                         |
| GET    | `/plans`                           | Your plans                                                 |
| POST   | `/plans`                           | Create a plan (optionally with phase names)                |
| GET    | `/plans/:id`                       | One plan with phases, days and tasks                       |
| GET    | `/plans/:id/stats?tz=Asia/Kolkata` | Progress totals, per type/phase, streaks, daily activity   |
| PATCH  | `/plans/:id`                       | Rename or change start date                                |
| POST   | `/plans/:id/days`                  | Add a day at the end                                       |
| PATCH  | `/days/:id`                        | Edit title, note, phase or position                        |
| DELETE | `/days/:id`                        | Delete a day and its tasks                                 |
| POST   | `/days/:id/tasks`                  | Add a task to a day                                        |
| PATCH  | `/tasks/:id`                       | Edit a task; `{ "done": true }` ticks it off               |
| DELETE | `/tasks/:id`                       | Delete a task                                              |

## Scripts

| Command                | What it does                                      |
| ---------------------- | ------------------------------------------------- |
| `npm run dev`          | Start API + web app (open http://localhost:5173)  |
| `npm run typecheck`    | Type-check every workspace                        |
| `npm test`             | Run API tests (uses a separate `_test` database)  |
| `npm run lint`         | Find bugs and risky patterns with ESLint          |
| `npm run format`       | Format all files with Prettier                    |
| `npm run format:check` | Check formatting without changing files (for CI)  |
| `npm run db:up`        | Start the Postgres container                      |
| `npm run db:down`      | Stop it (your data is kept in a Docker volume)    |
| `npm run db:logs`      | Follow the database logs                          |
| `npm run db:psql`      | Open a SQL prompt inside the database             |
| `npm run db:generate`  | Create a SQL migration after changing `schema.ts` |
| `npm run db:migrate`   | Apply pending migrations to the database          |
| `npm run db:seed`      | Reset the demo user and load the 60-day plan      |
| `npm run db:studio`    | Browse the database in Drizzle Studio             |
