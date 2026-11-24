import type { Phase, PlanDetail, Task } from "@milestone/shared";
import { isDayDone, isTaskDone } from "../lib/progress";
import type { PlanEditor } from "../lib/queries";
import { ConfirmButton } from "./ConfirmButton";
import { DayNotes } from "./DayNotes";
import { EditableText } from "./EditableText";
import { ProgressBar } from "./StatsRow";
import { TaskEditRow, TaskRow } from "./TaskRow";

type Day = PlanDetail["days"][number];

interface DayCardProps {
  planId: string;
  day: Day;
  number: number; // 1-based, for display
  date: string; // e.g. "24 Nov"
  color: string;
  isToday: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onToggleTask: (task: Task) => void;
  editing: boolean;
  editor: PlanEditor;
  phases: Phase[];
}

const FIELD =
  "min-h-10 rounded-[10px] border-[1.5px] border-line bg-bg px-3 py-1.5";

const SMALL_BUTTON =
  "min-h-9 cursor-pointer rounded-full border-[1.5px] border-ink bg-bg px-3 text-sm font-semibold";

// One collapsible day: header with progress, then its tasks.
// "Controlled": the parent decides if it's open, so the map can open it too.
export function DayCard({
  planId,
  day,
  number,
  date,
  color,
  isToday,
  open,
  onOpenChange,
  onToggleTask,
  editing,
  editor,
  phases,
}: DayCardProps) {
  const done = day.tasks.filter(isTaskDone).length;
  const pct = day.tasks.length
    ? Math.round((done / day.tasks.length) * 100)
    : 0;

  return (
    <details
      id={`day-${number}`}
      open={open}
      onToggle={(e) => {
        if (e.currentTarget.open !== open) onOpenChange(e.currentTarget.open);
      }}
      className={`scroll-mt-20 rounded-2xl bg-card ${isToday ? "border-2 border-ink" : "border border-line"}`}
    >
      <summary className="grid cursor-pointer list-none grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3.5 gap-y-1 px-4 py-3.5 sm:grid-cols-[auto_minmax(0,1fr)_auto] [&::-webkit-details-marker]:hidden">
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
        <span className="col-span-full text-left text-[13px] whitespace-nowrap text-mute sm:col-span-1 sm:text-right">
          {date}
          {isToday && " · today"} · {done}/{day.tasks.length}
        </span>
        <div className="col-span-full">
          <ProgressBar pct={pct} color={color} />
        </div>
      </summary>

      <div className="px-4 pb-4">
        {editing && (
          <div className="mb-2.5 grid grid-cols-[minmax(0,1fr)_auto] gap-2 sm:grid-cols-[minmax(0,1fr)_180px_auto]">
            <EditableText
              value={day.title}
              onSave={(title) =>
                editor.updateDay.mutate({ dayId: day.id, input: { title } })
              }
              aria-label={`Title of day ${number}`}
              className={FIELD}
            />
            <select
              value={day.phaseId ?? ""}
              onChange={(e) =>
                editor.updateDay.mutate({
                  dayId: day.id,
                  input: { phaseId: e.target.value || null },
                })
              }
              aria-label={`Phase of day ${number}`}
              className={`${FIELD} col-span-full row-start-2 sm:col-span-1 sm:row-start-auto`}
            >
              <option value="">No phase</option>
              {phases.map((phase) => (
                <option key={phase.id} value={phase.id}>
                  {phase.name}
                </option>
              ))}
            </select>
            <ConfirmButton
              label={`Delete day ${number}`}
              onConfirm={() => editor.deleteDay.mutate(day.id)}
            >
              Delete day
            </ConfirmButton>
          </div>
        )}

        {day.tasks.length === 0 && (
          <p className="py-2 text-sm text-mute">No tasks yet.</p>
        )}
        <ul className="grid gap-1">
          {day.tasks.map((task) => (
            <li key={task.id}>
              {editing ? (
                <TaskEditRow task={task} editor={editor} />
              ) : (
                <TaskRow task={task} onToggle={() => onToggleTask(task)} />
              )}
            </li>
          ))}
        </ul>

        {editing && (
          <button
            type="button"
            className={`${SMALL_BUTTON} mt-2`}
            onClick={() =>
              editor.addTask.mutate({
                dayId: day.id,
                input: { type: "learn", text: "New task", minutes: 30 },
              })
            }
          >
            Add task
          </button>
        )}

        <DayNotes
          planId={planId}
          dayId={day.id}
          dayNumber={number}
          initialNote={day.note}
        />
      </div>
    </details>
  );
}
