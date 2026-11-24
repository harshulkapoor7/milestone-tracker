import { and, eq, sql } from "drizzle-orm";
import type { CreateDayInput, UpdateDayInput } from "@milestone/shared";
import { db } from "../../db/client";
import { days, phases, plans } from "../../db/schema";
import { AppError } from "../../lib/app-error";
import { assertPlanOwned } from "../plans/plans.service";

export async function createDay(
  userId: string,
  planId: string,
  input: CreateDayInput,
) {
  await assertPlanOwned(userId, planId);
  if (input.phaseId) await assertPhaseInPlan(input.phaseId, planId);

  const [day] = await db
    .insert(days)
    .values({
      planId,
      title: input.title,
      phaseId: input.phaseId,
      position: await nextDayPosition(planId),
    })
    .returning();
  return day;
}

export async function updateDay(
  userId: string,
  dayId: string,
  input: UpdateDayInput,
) {
  const owned = await findOwnedDay(userId, dayId);
  if (input.phaseId) await assertPhaseInPlan(input.phaseId, owned.planId);

  const [day] = await db
    .update(days)
    .set(input)
    .where(eq(days.id, dayId))
    .returning();
  return day;
}

export async function deleteDay(userId: string, dayId: string) {
  await findOwnedDay(userId, dayId);
  await db.delete(days).where(eq(days.id, dayId)); // its tasks go too (cascade)
}

// A day belongs to a user through its plan: days → plans.user_id.
// Exported so the tasks module can check ownership before adding a task.
export async function findOwnedDay(userId: string, dayId: string) {
  const [day] = await db
    .select({ id: days.id, planId: days.planId })
    .from(days)
    .innerJoin(plans, eq(days.planId, plans.id))
    .where(and(eq(days.id, dayId), eq(plans.userId, userId)));
  if (!day) throw new AppError(404, "NOT_FOUND", "Day not found");
  return day;
}

// Stops a day being moved into a phase from a different plan.
async function assertPhaseInPlan(phaseId: string, planId: string) {
  const [phase] = await db
    .select({ id: phases.id })
    .from(phases)
    .where(and(eq(phases.id, phaseId), eq(phases.planId, planId)));
  if (!phase) {
    throw new AppError(
      400,
      "INVALID_PHASE",
      "Phase does not belong to this plan",
    );
  }
}

// New days go at the end: highest position + 1 (or 0 for the first day).
async function nextDayPosition(planId: string) {
  const [row] = await db
    .select({
      next: sql`coalesce(max(${days.position}), -1) + 1`.mapWith(Number),
    })
    .from(days)
    .where(eq(days.planId, planId));
  return row?.next ?? 0;
}
