// Matches tasks.type in docs/plan.md and the task_type enum in Postgres.
export const TASK_TYPES = ["learn", "practice", "build"] as const;

export type TaskType = (typeof TASK_TYPES)[number];
