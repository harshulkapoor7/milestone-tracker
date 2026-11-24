import type { PlanDetail, TaskType } from "@milestone/shared";

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

export function planStats(plan: PlanDetail) {
  const tasks = plan.days.flatMap((d) => d.tasks);
  const byType = (type: TaskType) => {
    const all = tasks.filter((t) => t.type === type);
    return { done: all.filter(isTaskDone).length, total: all.length };
  };
  const minutes = tasks.reduce((sum, t) => sum + t.minutes, 0);
  const doneMinutes = tasks
    .filter(isTaskDone)
    .reduce((sum, t) => sum + t.minutes, 0);

  // Streak: consecutive finished days counting back from today
  // (today only counts once it's finished, like the prototype).
  let i = currentDayIndex(plan.startDate, plan.days.length);
  const today = plan.days[i];
  if (today && !isDayDone(today)) i--;
  let streak = 0;
  while (i >= 0 && plan.days[i] && isDayDone(plan.days[i]!)) {
    streak++;
    i--;
  }

  return {
    daysDone: plan.days.filter(isDayDone).length,
    dayCount: plan.days.length,
    learn: byType("learn"),
    practice: byType("practice"),
    build: byType("build"),
    hoursDone: Math.round(doneMinutes / 60),
    hoursTotal: Math.round(minutes / 60),
    percent: tasks.length
      ? Math.round((tasks.filter(isTaskDone).length / tasks.length) * 100)
      : 0,
    streak,
  };
}

// Phase position → its metro-line colour (cycles if there are more than 4).
export const phaseColor = (position: number) => `var(--color-l${position % 4})`;

// Day index → its calendar date, e.g. "24 Nov".
export function dayDate(startDate: string, index: number) {
  const date = new Date(`${startDate}T00:00:00`);
  date.setDate(date.getDate() + index);
  return date.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}
