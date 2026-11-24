# Milestones

Each milestone = one branch + one PR into main. Tick it off when merged.

- [ ] **1. Repo setup**: npm workspaces, TypeScript config, ESLint + Prettier, Docker Compose for Postgres, README
- [ ] **2. API skeleton**: Express app, `/health` route, env validation with Zod, central error handler, logging
- [ ] **3. Database**: Drizzle schema (users, sessions, plans, phases, days, tasks), first migration, seed script for the 60-day plan
- [ ] **4. CRUD**: plans / days / tasks endpoints, Zod validation, Vitest + Supertest tests
- [ ] **5. Frontend**: rebuild docs/prototype.html in React, fetching from the API with TanStack Query
- [ ] **6. Auth**: register / login / logout, sessions, ownership checks on every query
- [ ] **7. Stats & streaks**: computed in SQL (GROUP BY, window functions)
- [ ] **8. CI + deploy**: GitHub Actions (lint, test, build), hosted Postgres, API host, Vercel for web
- [ ] **9. Polish**: README with architecture diagram, screenshots, live link

## Data model

users(id, email, password_hash, created_at)
sessions(id, user_id, expires_at)
plans(id, user_id, title, start_date)
phases(id, plan_id, name, position)
days(id, plan_id, phase_id, position, title, note)
tasks(id, day_id, type: learn|practice|build, text, minutes, position, done_at NULL)

## API

POST /auth/register · POST /auth/login · POST /auth/logout · GET /me
GET /plans · POST /plans · GET /plans/:id · PATCH /plans/:id
POST /plans/:id/days · PATCH /days/:id · DELETE /days/:id
POST /days/:id/tasks · PATCH /tasks/:id · DELETE /tasks/:id
GET /plans/:id/stats
