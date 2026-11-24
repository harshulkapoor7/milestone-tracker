import { and, eq, sql } from "drizzle-orm";
import type { CreateTaskInput, UpdateTaskInput } from "@milestone/shared";
import { db } from "../../db/client";
import { days, plans, tasks } from "../../db/schema";
import { AppError } from "../../lib/app-error";
import { findOwnedDay } from "../days/days.service";

export async function createTask(
  userId: string,
  dayId: string,
  input: CreateTaskInput,
) {
  await findOwnedDay(userId, dayId);
  const [task] = await db
    .insert(tasks)
    .values({ ...input, dayId, position: await nextTaskPosition(dayId) })
    .returning();
  return task;
}

export async function updateTask(
  userId: string,
  taskId: string,
  input: UpdateTaskInput,
) {
  await findOwnedTask(userId, taskId);
  const { done, ...fields } = input;

  const [task] = await db
    .update(tasks)
    .set({
      ...fields,
      // done: true → record when; done: false → clear it; not sent → leave as is
      ...(done !== undefined && { doneAt: done ? new Date() : null }),
    })
    .where(eq(tasks.id, taskId))
    .returning();
  return task;
}

export async function deleteTask(userId: string, taskId: string) {
  await findOwnedTask(userId, taskId);
  await db.delete(tasks).where(eq(tasks.id, taskId));
}

// A task belongs to a user through tasks → days → plans.user_id.
async function findOwnedTask(userId: string, taskId: string) {
  const [task] = await db
    .select({ id: tasks.id })
    .from(tasks)
    .innerJoin(days, eq(tasks.dayId, days.id))
    .innerJoin(plans, eq(days.planId, plans.id))
    .where(and(eq(tasks.id, taskId), eq(plans.userId, userId)));
  if (!task) throw new AppError(404, "NOT_FOUND", "Task not found");
}

async function nextTaskPosition(dayId: string) {
  const [row] = await db
    .select({
      next: sql`coalesce(max(${tasks.position}), -1) + 1`.mapWith(Number),
    })
    .from(tasks)
    .where(eq(tasks.dayId, dayId));
  return row?.next ?? 0;
}
