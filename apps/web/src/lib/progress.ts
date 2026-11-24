import type { PlanDetail } from "@milestone/shared";

// Pure functions: plan data in, numbers out. No React, easy to reason about.

type DayWithTasks = PlanDetail["days"][number];

export const isTaskDone = (task: { doneAt: string | null }) =>
  task.doneAt !== null;

export const isDayDone = (day: DayWithTasks) =>
  day.tasks.length > 0 && day.tasks.every(isTaskDone);

// Which day of the plan is today? (0-based, clamped to the plan's length)
export function currentDayIndex(startDate: string, dayCount: number) {
  const today = new Date();
  const start = new Date(`${startDate}T00:00:00`); // local midnight
  const msPerDay = 24 * 60 * 60 * 1000;
  const startOfToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  const diff = Math.floor(
    (startOfToday.getTime() - start.getTime()) / msPerDay,
  );
  return Math.min(Math.max(diff, 0), Math.max(dayCount - 1, 0));
}

// Phase position → its metro-line colour (cycles if there are more than 4).
export const phaseColor = (position: number) => `var(--color-l${position % 4})`;

// Day index → its calendar date, e.g. "24 Nov".
export function dayDate(startDate: string, index: number) {
  const date = new Date(`${startDate}T00:00:00`);
  date.setDate(date.getDate() + index);
  return date.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}
