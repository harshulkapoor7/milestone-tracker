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

// ---- Auth ----
// Emails are trimmed and lowercased first, so "Alice@X.dev " and "alice@x.dev"
// are the same account.
const emailSchema = z.string().trim().toLowerCase().pipe(z.email());

export const registerSchema = z.object({
  email: emailSchema,
  // Length is what makes passwords strong; 8 is NIST's minimum.
  // Max stops someone sending a 10 MB "password" to make hashing slow.
  password: z.string().min(8, "Use at least 8 characters").max(200),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(200),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

// ---- Stats ----
// An IANA time zone name like "Asia/Kolkata" or "Europe/London".
// The streak depends on it: 11 pm in Mumbai is already tomorrow in Tokyo.
const isTimeZone = (tz: string) => {
  try {
    new Intl.DateTimeFormat("en", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
};

export const statsQuerySchema = z.object({
  tz: z.string().max(64).refine(isTimeZone, "Unknown time zone").default("UTC"),
});
