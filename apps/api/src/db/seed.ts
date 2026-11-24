// Fills the database with a demo user and the 60-day plan.
// Safe to run again: it deletes the demo user first, and the cascade removes their old plan.
// Run with: npm run db:seed
import { eq } from "drizzle-orm";
import { logger } from "../logger";
import { db, pool } from "./client";
import { days, phases, plans, tasks, users } from "./schema";
import {
  BUILD,
  DEMO_EMAIL,
  LEARN,
  PATTERNS,
  PHASES,
  PLAN_TITLE,
} from "./seed-data";

const DAYS_PER_PHASE = 15;

async function seed() {
  // A transaction: either every insert succeeds, or none of them are kept.
  await db.transaction(async (tx) => {
    await tx.delete(users).where(eq(users.email, DEMO_EMAIL));

    // "!" is not a valid password hash, so nobody can log in as the demo user
    // until real auth exists (Milestone 6).
    const [user] = await tx
      .insert(users)
      .values({ email: DEMO_EMAIL, passwordHash: "!" })
      .returning();
    if (!user) throw new Error("Failed to create demo user");

    const [plan] = await tx
      .insert(plans)
      .values({
        userId: user.id,
        title: PLAN_TITLE,
        startDate: new Date().toISOString().slice(0, 10), // today, "YYYY-MM-DD"
      })
      .returning();
    if (!plan) throw new Error("Failed to create plan");

    const phaseRows = await tx
      .insert(phases)
      .values(
        PHASES.map((name, position) => ({ planId: plan.id, name, position })),
      )
      .returning();
    const phaseIdAt = new Map(phaseRows.map((p) => [p.position, p.id]));

    const dayRows = await tx
      .insert(days)
      .values(
        LEARN.map((topic, position) => ({
          planId: plan.id,
          phaseId: phaseIdAt.get(Math.floor(position / DAYS_PER_PHASE)),
          position,
          title: topic,
        })),
      )
      .returning();

    // Three tasks per day, same rules as the prototype.
    const taskRows = dayRows.flatMap((day) => {
      const i = day.position;
      const phase = Math.floor(i / DAYS_PER_PHASE);
      const level = phase < 1 ? "easy" : "medium";
      return [
        {
          dayId: day.id,
          type: "learn" as const,
          text: day.title,
          minutes: 90,
          position: 0,
        },
        {
          dayId: day.id,
          type: "practice" as const,
          text: `2 LeetCode ${level} problems: ${PATTERNS[i % PATTERNS.length]}`,
          minutes: 60,
          position: 1,
        },
        {
          dayId: day.id,
          type: "build" as const,
          text: `${BUILD[Math.floor(i / 2)]} (part ${(i % 2) + 1} of 2)`,
          minutes: 60,
          position: 2,
        },
      ];
    });
    await tx.insert(tasks).values(taskRows);

    logger.info(
      `Seeded ${DEMO_EMAIL}: 1 plan, ${phaseRows.length} phases, ${dayRows.length} days, ${taskRows.length} tasks`,
    );
  });
}

try {
  await seed();
} finally {
  await pool.end(); // close DB connections so the script can exit
}
