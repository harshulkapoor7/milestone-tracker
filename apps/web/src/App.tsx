import { useState, type ReactNode } from "react";
import { DayCard } from "./components/DayCard";
import { MetroMap } from "./components/MetroMap";
import { PhaseLegend } from "./components/PhaseLegend";
import { StatsRow } from "./components/StatsRow";
import {
  currentDayIndex,
  dayDate,
  phaseColor,
  planStats,
} from "./lib/progress";
import { usePlan, usePlans, useToggleTask } from "./lib/queries";

export function App() {
  const plans = usePlans();
  const planId = plans.data?.[0]?.id; // one plan per user for now
  const plan = usePlan(planId);
  const toggleTask = useToggleTask(planId ?? "");

  // Which days are expanded. null = "not touched yet" → only today is open.
  // (Hooks must run on every render, so this lives above the early returns.)
  const [openDays, setOpenDays] = useState<Set<number> | null>(null);

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
    setDayOpen(i, true);
    // Wait one tick so React has rendered the opened card before scrolling.
    setTimeout(() => {
      document
        .getElementById(`day-${i + 1}`)
        ?.scrollIntoView({ block: "start" });
    });
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
            <button
              type="button"
              onClick={() => goToDay(today)}
              className="min-h-11 cursor-pointer rounded-full border-2 border-ink bg-ink px-4.5 font-semibold text-bg"
            >
              Go to today
            </button>
          </div>

          <MetroMap plan={data} today={today} onSelectDay={goToDay} />
          <PhaseLegend plan={data} />
          <StatsRow stats={stats} />
        </div>
      </header>

      <main className="px-[max(5vw,16px)] pb-12">
        <div className="mx-auto grid max-w-[1240px] gap-2.5">
          {data.days.map((day, i) => (
            <DayCard
              key={day.id}
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
            />
          ))}
        </div>
      </main>
    </>
  );
}

function Message({ children }: { children: ReactNode }) {
  return <p className="p-10 text-center text-mute">{children}</p>;
}
