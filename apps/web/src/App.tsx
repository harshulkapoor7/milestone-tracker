import type { ReactNode } from "react";
import { DayCard } from "./components/DayCard";
import { StatsRow } from "./components/StatsRow";
import { currentDayIndex, phaseColor, planStats } from "./lib/progress";
import { usePlan, usePlans, useToggleTask } from "./lib/queries";

export function App() {
  const plans = usePlans();
  const planId = plans.data?.[0]?.id; // one plan per user for now
  const plan = usePlan(planId);
  const toggleTask = useToggleTask(planId ?? "");

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

  return (
    <>
      <header className="px-[max(5vw,16px)] py-[clamp(20px,3.5vw,48px)]">
        <div className="mx-auto max-w-[1240px]">
          <h1 className="text-[clamp(30px,5vw,48px)] leading-[1.05] font-extrabold text-balance">
            {data.title}
          </h1>
          <p className="mt-2 text-mute">
            Today is <b className="text-ink">Day {today + 1}</b> of{" "}
            {data.days.length} · <b className="text-ink">{stats.percent}%</b>{" "}
            complete
          </p>
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
              isToday={i === today}
              color={phaseColor(phasePosition.get(day.phaseId ?? "") ?? 0)}
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
