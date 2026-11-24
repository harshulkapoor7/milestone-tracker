import { and, asc, eq } from "drizzle-orm";
import type { CreatePlanInput, UpdatePlanInput } from "@milestone/shared";
import { db } from "../../db/client";
import { phases, plans } from "../../db/schema";
import { AppError } from "../../lib/app-error";

// Every query includes `userId`, so a user can only ever touch their own plans.
// Someone else's plan gives 404, not 403: we don't even confirm it exists.

export async function listPlans(userId: string) {
  return db
    .select()
    .from(plans)
    .where(eq(plans.userId, userId))
    .orderBy(asc(plans.createdAt));
}

export async function createPlan(userId: string, input: CreatePlanInput) {
  return db.transaction(async (tx) => {
    const [plan] = await tx
      .insert(plans)
      .values({ userId, title: input.title, startDate: input.startDate })
      .returning();
    if (!plan) throw new Error("Insert returned no plan");

    const createdPhases = input.phases.length
      ? await tx
          .insert(phases)
          .values(
            input.phases.map((name, position) => ({
              planId: plan.id,
              name,
              position,
            })),
          )
          .returning()
      : [];

    return { ...plan, phases: createdPhases };
  });
}

// The whole plan in one response: phases, and days with their tasks, all in order.
export async function getPlan(userId: string, planId: string) {
  const plan = await db.query.plans.findFirst({
    where: (p) => and(eq(p.id, planId), eq(p.userId, userId)),
    with: {
      phases: { orderBy: (ph) => [asc(ph.position)] },
      days: {
        orderBy: (d) => [asc(d.position)],
        with: { tasks: { orderBy: (t) => [asc(t.position)] } },
      },
    },
  });
  if (!plan) throw new AppError(404, "NOT_FOUND", "Plan not found");
  return plan;
}

export async function updatePlan(
  userId: string,
  planId: string,
  input: UpdatePlanInput,
) {
  const [plan] = await db
    .update(plans)
    .set(input)
    .where(and(eq(plans.id, planId), eq(plans.userId, userId)))
    .returning();
  if (!plan) throw new AppError(404, "NOT_FOUND", "Plan not found");
  return plan;
}

// Used by other modules (e.g. days) before they add things to a plan.
export async function assertPlanOwned(userId: string, planId: string) {
  const [plan] = await db
    .select({ id: plans.id })
    .from(plans)
    .where(and(eq(plans.id, planId), eq(plans.userId, userId)));
  if (!plan) throw new AppError(404, "NOT_FOUND", "Plan not found");
}
