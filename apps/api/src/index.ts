// Temporary entry point: proves the api can import from @milestone/shared.
// Replaced by the Express server in Milestone 2.
import { TASK_TYPES, type TaskType } from "@milestone/shared";

const first: TaskType = TASK_TYPES[0];
console.log(
  `API ready. Task types: ${TASK_TYPES.join(", ")} (first: ${first})`,
);
