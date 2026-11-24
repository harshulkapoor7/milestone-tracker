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

## Done so far

- Installed Claude Code, fixed PATH, logged in with Claude Pro.
- Renamed folder to milestone-tracker, ran git init.
- Created: .gitignore, CLAUDE.md, README.md, docs/plan.md, docs/prototype.html,
  .gitkeep in apps/api, apps/web, packages/shared.

## Next

1. First commit, create empty GitHub repo `milestone-tracker`, push to main.
2. Milestone 1 (repo setup): npm workspaces, TypeScript config, ESLint + Prettier,
   Docker Compose for Postgres (Docker Desktop for Apple Silicon), README.
   Teach me one step at a time and check my work after each.
