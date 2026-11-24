import { relations, sql } from "drizzle-orm";
import {
  check,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { TASK_TYPES } from "@milestone/shared";

// Reusable column builders. Column names are written in camelCase here and stored
// as snake_case in Postgres (see `casing` in client.ts and drizzle.config.ts).
const id = () =>
  uuid()
    .primaryKey()
    .default(sql`uuidv7()`);
const createdAt = () =>
  timestamp({ withTimezone: true }).notNull().defaultNow();

// Postgres enum built from the shared list, so DB, API and web can never disagree.
export const taskType = pgEnum("task_type", TASK_TYPES);

export const users = pgTable(
  "users",
  {
    id: id(),
    email: text().notNull(), // stored lowercased (enforced in the auth service, Milestone 6)
    passwordHash: text().notNull(),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("users_email_unique").on(t.email)],
);

export const sessions = pgTable(
  "sessions",
  {
    id: text().primaryKey(), // hash of the cookie's session token (Milestone 6)
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("sessions_user_id_idx").on(t.userId)],
);

export const plans = pgTable(
  "plans",
  {
    id: id(),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text().notNull(),
    startDate: date({ mode: "string" }).notNull(), // "2026-11-24": a calendar day, no time
    createdAt: createdAt(),
  },
  (t) => [index("plans_user_id_idx").on(t.userId)],
);

export const phases = pgTable(
  "phases",
  {
    id: id(),
    planId: uuid()
      .notNull()
      .references(() => plans.id, { onDelete: "cascade" }),
    name: text().notNull(),
    position: integer().notNull(),
  },
  (t) => [index("phases_plan_id_position_idx").on(t.planId, t.position)],
);

export const days = pgTable(
  "days",
  {
    id: id(),
    planId: uuid()
      .notNull()
      .references(() => plans.id, { onDelete: "cascade" }),
    phaseId: uuid().references(() => phases.id, { onDelete: "set null" }),
    position: integer().notNull(),
    title: text().notNull(),
    note: text().notNull().default(""),
  },
  (t) => [
    index("days_plan_id_position_idx").on(t.planId, t.position),
    index("days_phase_id_idx").on(t.phaseId),
  ],
);

export const tasks = pgTable(
  "tasks",
  {
    id: id(),
    dayId: uuid()
      .notNull()
      .references(() => days.id, { onDelete: "cascade" }),
    type: taskType().notNull(),
    text: text().notNull(),
    minutes: integer().notNull().default(30),
    position: integer().notNull(),
    doneAt: timestamp({ withTimezone: true }), // null = not done (never a boolean)
  },
  (t) => [
    index("tasks_day_id_position_idx").on(t.dayId, t.position),
    check("tasks_minutes_non_negative", sql`${t.minutes} >= 0`),
  ],
);

// Relations: tell Drizzle how tables connect, so one query can load
// a plan with its phases, days and tasks nested inside. No SQL changes.
export const plansRelations = relations(plans, ({ many }) => ({
  phases: many(phases),
  days: many(days),
}));

export const phasesRelations = relations(phases, ({ one }) => ({
  plan: one(plans, { fields: [phases.planId], references: [plans.id] }),
}));

export const daysRelations = relations(days, ({ one, many }) => ({
  plan: one(plans, { fields: [days.planId], references: [plans.id] }),
  phase: one(phases, { fields: [days.phaseId], references: [phases.id] }),
  tasks: many(tasks),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  day: one(days, { fields: [tasks.dayId], references: [days.id] }),
}));
