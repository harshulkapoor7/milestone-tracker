import { useState, type ReactNode } from "react";
import { DayCard } from "./components/DayCard";
import { FilterBar } from "./components/FilterBar";
import { MetroMap } from "./components/MetroMap";
import { PlanSettings } from "./components/PlanSettings";
import { PhaseLegend } from "./components/PhaseLegend";
import { StatsRow } from "./components/StatsRow";
import {
  currentDayIndex,
  dayDate,
  phaseColor,
  planStats,
} from "./lib/progress";
import { dayMatches, NO_FILTERS, type Filters } from "./lib/filters";
import { usePlan, usePlanEditor, usePlans, useToggleTask } from "./lib/queries";

export function App() {
  const plans = usePlans();
  const planId = plans.data?.[0]?.id; // one plan per user for now
  const plan = usePlan(planId);
  const toggleTask = useToggleTask(planId ?? "");
  const editor = usePlanEditor(planId ?? "");

  // Which days are expanded. null = "not touched yet" → only today is open.
  // (Hooks must run on every render, so this lives above the early returns.)
  const [openDays, setOpenDays] = useState<Set<number> | null>(null);
  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
  const [editing, setEditing] = useState(false);

  if (plans.isPending || (planId && plan.isPending)) {
    return <Message>Loading your plan…</Message>;
  }
  if (plans.error ?? plan.error) {
    return (
      <Message>
        Couldn't reach the API: {(plans.error ?? plan.error)?.message}. Is{" "}
        <code>npm run dev</code> running?
      </Message>
    );
  }
  if (!plan.data) {
    return (
      <Message>
        No plan yet. Run <code>npm run db:seed</code> to load the 60-day plan.
      </Message>
    );
  }

  const data = plan.data;
  const stats = planStats(data);
  const today = currentDayIndex(data.startDate, data.days.length);
  const phasePosition = new Map(data.phases.map((p) => [p.id, p.position]));
  const visibleDays = data.days
    .map((day, index) => ({ day, index }))
    .filter(({ day }) => dayMatches(day, filters));
  const isOpen = (i: number) => (openDays ?? new Set([today])).has(i);

  const setDayOpen = (i: number, open: boolean) => {
    setOpenDays((prev) => {
      const next = new Set(prev ?? [today]);
      if (open) next.add(i);
      else next.delete(i);
      return next;
    });
  };

  // Open a day and scroll to it (used by the map and "Go to today").
  const goToDay = (i: number) => {
    setFilters(NO_FILTERS); // make sure the day isn't hidden by a filter
    setDayOpen(i, true);
    // Wait one tick so React has rendered the opened card before scrolling.
    setTimeout(() => {
      document
        .getElementById(`day-${i + 1}`)
        ?.scrollIntoView({ block: "start" });
    });
  };

  // New days go at the end, in the same phase as the current last day.
  const addDay = async () => {
    const lastDay = data.days.at(-1);
    await editor.addDay.mutateAsync({
      title: "New day",
      phaseId: lastDay?.phaseId ?? null,
    });
    goToDay(data.days.length); // the new day's index (resolves after the refetch)
  };

  return (
    <>
      <header className="px-[max(5vw,16px)] py-[clamp(20px,3.5vw,48px)]">
        <div className="mx-auto max-w-[1240px]">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-[clamp(30px,5vw,48px)] leading-[1.05] font-extrabold text-balance">
                {data.title}
              </h1>
              <p className="mt-2 text-mute">
                Today is <b className="text-ink">Day {today + 1}</b> of{" "}
                {data.days.length} ·{" "}
                <b className="text-ink">{stats.percent}%</b> complete
              </p>
            </div>
            <div className="flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={() => goToDay(today)}
                className="min-h-11 cursor-pointer rounded-full border-2 border-ink bg-ink px-4.5 font-semibold text-bg"
              >
                Go to today
              </button>
              <button
                type="button"
                aria-pressed={editing}
                onClick={() => setEditing((on) => !on)}
                className={`min-h-11 cursor-pointer rounded-full border-2 border-ink px-4.5 font-semibold ${editing ? "bg-ink text-bg" : "bg-bg text-ink"}`}
              >
                {editing ? "Done editing" : "Edit plan"}
              </button>
            </div>
          </div>

          <MetroMap plan={data} today={today} onSelectDay={goToDay} />
          <PhaseLegend plan={data} />
          <StatsRow stats={stats} />
        </div>
      </header>

      <main className="px-[max(5vw,16px)] pb-12">
        <div className="mx-auto max-w-[1240px]">
          <FilterBar
            phases={data.phases}
            filters={filters}
            onChange={setFilters}
          />
          <div className="mt-4 grid gap-2.5">
            {visibleDays.length === 0 && (
              <p className="rounded-2xl border-[1.5px] border-dashed border-line p-7 text-center text-mute">
                No days match these filters.
              </p>
            )}
            {visibleDays.map(({ day, index: i }) => (
              <DayCard
                key={day.id}
                planId={data.id}
                day={day}
                number={i + 1}
                date={dayDate(data.startDate, i)}
                isToday={i === today}
                color={phaseColor(phasePosition.get(day.phaseId ?? "") ?? 0)}
                open={isOpen(i)}
                onOpenChange={(open) => setDayOpen(i, open)}
                onToggleTask={(task) =>
                  toggleTask.mutate({
                    taskId: task.id,
                    done: task.doneAt === null,
                  })
                }
                editing={editing}
                editor={editor}
                phases={data.phases}
              />
            ))}
          </div>
          {editing && (
            <button
              type="button"
              onClick={() => void addDay()}
              disabled={editor.addDay.isPending}
              className="mt-4 min-h-11 cursor-pointer rounded-full border-2 border-ink bg-bg px-4.5 font-semibold disabled:opacity-50"
            >
              {editor.addDay.isPending ? "Adding…" : "Add day"}
            </button>
          )}
        </div>
      </main>

      <PlanSettings plan={data} editor={editor} />
    </>
  );
}

function Message({ children }: { children: ReactNode }) {
  return <p className="p-10 text-center text-mute">{children}</p>;
}
