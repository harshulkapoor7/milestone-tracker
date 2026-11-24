import { z } from "zod";
import { TASK_TYPES } from "./constants";

// Request-body rules shared by the API (to validate) and the web app (to type forms).
// "Create" schemas list required fields; "Update" schemas make every field optional,
// but refuse an empty body so PATCH {} is a clear 400 instead of a silent no-op.

const nonEmpty = (value: object) => Object.keys(value).length > 0;
const NON_EMPTY_MESSAGE = "Provide at least one field to update";

export const idSchema = z.uuid();

// ---- Plans ----
const planFields = z.object({
  title: z.string().trim().min(1).max(200),
  startDate: z.iso.date(), // "YYYY-MM-DD"
});

export const createPlanSchema = planFields.extend({
  phases: z.array(z.string().trim().min(1).max(100)).max(20).default([]),
});
export const updatePlanSchema = planFields
  .partial()
  .refine(nonEmpty, NON_EMPTY_MESSAGE);

// ---- Days ----
const dayFields = z.object({
  title: z.string().trim().min(1).max(200),
  phaseId: idSchema.nullable(),
  note: z.string().max(5000),
  position: z.int().min(0),
});

export const createDaySchema = dayFields
  .pick({ title: true })
  .extend({ phaseId: idSchema.nullable().default(null) });
export const updateDaySchema = dayFields
  .partial()
  .refine(nonEmpty, NON_EMPTY_MESSAGE);

// ---- Tasks ----
const taskFields = z.object({
  type: z.enum(TASK_TYPES),
  text: z.string().trim().min(1).max(500),
  minutes: z
    .int()
    .min(0)
    .max(24 * 60),
  position: z.int().min(0),
  // The client says done or not; the server records *when* (tasks.done_at).
  done: z.boolean(),
});

export const createTaskSchema = taskFields.pick({
  type: true,
  text: true,
  minutes: true,
});
export const updateTaskSchema = taskFields
  .partial()
  .refine(nonEmpty, NON_EMPTY_MESSAGE);

export type CreatePlanInput = z.infer<typeof createPlanSchema>;
export type UpdatePlanInput = z.infer<typeof updatePlanSchema>;
export type CreateDayInput = z.infer<typeof createDaySchema>;
export type UpdateDayInput = z.infer<typeof updateDaySchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
