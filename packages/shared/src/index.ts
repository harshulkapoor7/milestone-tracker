// Shared between api and web. Matches tasks.type in docs/plan.md.
export const TASK_TYPES = ["learn", "practice", "build"] as const;

export type TaskType = (typeof TASK_TYPES)[number];
