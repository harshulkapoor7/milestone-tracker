import type { db } from "./client";
import { days, phases, plans, tasks } from "./schema";
import { BUILD, LEARN, PATTERNS, PHASES, PLAN_TITLE } from "./seed-data";

const DAYS_PER_PHASE = 15;

// The `tx` object Drizzle gives you inside db.transaction(async (tx) => …)
export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

// Builds the 60-day sample plan (same rules as the prototype) for one user.
// Used by the seed script and by registration, so every new user starts with it.
// Takes a transaction so the caller decides what it's all-or-nothing with.
export async function createSamplePlan(tx: Tx, userId: string) {
  const [plan] = await tx
    .insert(plans)
    .values({
      userId,
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

  // Three tasks per day: learn, practice, build.
  const taskRows = dayRows.flatMap((day) => {
    const i = day.position;
    const level = Math.floor(i / DAYS_PER_PHASE) < 1 ? "easy" : "medium";
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

  return {
    planId: plan.id,
    phases: phaseRows.length,
    days: dayRows.length,
    tasks: taskRows.length,
  };
}
