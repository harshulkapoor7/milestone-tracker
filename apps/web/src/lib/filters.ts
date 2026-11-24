import type { PlanDetail } from "@milestone/shared";
import { isDayDone } from "./progress";

export interface Filters {
  phaseId: string; // a phase id, or "all"
  hideDone: boolean;
  search: string;
}

export const NO_FILTERS: Filters = {
  phaseId: "all",
  hideDone: false,
  search: "",
};

type DayWithTasks = PlanDetail["days"][number];

// Does this day pass every active filter? Search looks in the title, note and tasks.
export function dayMatches(day: DayWithTasks, filters: Filters) {
  if (filters.phaseId !== "all" && day.phaseId !== filters.phaseId)
    return false;
  if (filters.hideDone && isDayDone(day)) return false;

  const query = filters.search.trim().toLowerCase();
  if (!query) return true;
  return [day.title, day.note, ...day.tasks.map((t) => t.text)].some((text) =>
    text.toLowerCase().includes(query),
  );
}
