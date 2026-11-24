import type { PlanDetail, Task } from "@milestone/shared";
import { isDayDone, isTaskDone } from "../lib/progress";
import { ProgressBar } from "./StatsRow";

type Day = PlanDetail["days"][number];

interface DayCardProps {
  day: Day;
  number: number; // 1-based, for display
  color: string;
  isToday: boolean;
  onToggleTask: (task: Task) => void;
}

// One collapsible day: header with progress, then its tasks.
export function DayCard({
  day,
  number,
  color,
  isToday,
  onToggleTask,
}: DayCardProps) {
  const done = day.tasks.filter(isTaskDone).length;
  const minutes = day.tasks.reduce((sum, t) => sum + t.minutes, 0);
  const pct = day.tasks.length
    ? Math.round((done / day.tasks.length) * 100)
    : 0;

  return (
    <details
      open={isToday}
      className={`rounded-2xl bg-card ${isToday ? "border-2 border-ink" : "border border-line"}`}
    >
      <summary className="grid cursor-pointer list-none grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3.5 gap-y-1 px-4 py-3.5 [&::-webkit-details-marker]:hidden">
        <span className="flex items-center gap-2 text-[15px] font-extrabold whitespace-nowrap">
          <i
            className="inline-block size-3 rounded-full border-[3px]"
            style={{
              borderColor: color,
              background: isDayDone(day) ? color : "transparent",
            }}
          />
          Day {number}
        </span>
        <span className="font-semibold">{day.title}</span>
        <span className="text-right text-[13px] whitespace-nowrap text-mute">
          {done}/{day.tasks.length} · {minutes} min
        </span>
        <div className="col-span-full">
          <ProgressBar pct={pct} />
        </div>
      </summary>

      <ul className="grid gap-1 px-4 pb-4">
        {day.tasks.map((task) => (
          <li key={task.id}>
            <label className="flex cursor-pointer items-start gap-2.5 py-2">
              <input
                type="checkbox"
                className="mt-0.5 size-5 flex-none cursor-pointer accent-l3"
                checked={isTaskDone(task)}
                onChange={() => onToggleTask(task)}
              />
              <TypeTag type={task.type} />
              <span
                className={`flex-1 ${isTaskDone(task) ? "text-mute line-through" : ""}`}
              >
                {task.text}
              </span>
              <span className="text-[13px] whitespace-nowrap text-mute">
                {task.minutes} min
              </span>
            </label>
          </li>
        ))}
      </ul>
    </details>
  );
}

const TAG_CLASS = {
  learn: "text-learn",
  practice: "text-practice",
  build: "text-build",
} as const;

function TypeTag({ type }: { type: Task["type"] }) {
  return (
    <span
      className={`mt-px flex-none rounded-full border-[1.5px] px-2 text-xs font-semibold capitalize ${TAG_CLASS[type]}`}
    >
      {type}
    </span>
  );
}
