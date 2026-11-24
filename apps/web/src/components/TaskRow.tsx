import { TASK_TYPES, type Task, type UpdateTaskInput } from "@milestone/shared";
import type { PlanEditor } from "../lib/queries";
import { isTaskDone } from "../lib/progress";
import { ConfirmButton } from "./ConfirmButton";
import { EditableText } from "./EditableText";

const TAG_CLASS = {
  learn: "text-learn",
  practice: "text-practice",
  build: "text-build",
} as const;

const FIELD =
  "min-h-10 rounded-[10px] border-[1.5px] border-line bg-bg px-3 py-1.5";

// Normal mode: a checkbox row you can tick.
export function TaskRow({
  task,
  onToggle,
}: {
  task: Task;
  onToggle: () => void;
}) {
  const done = isTaskDone(task);
  return (
    <label className="flex cursor-pointer items-start gap-2.5 py-2">
      <input
        type="checkbox"
        className="mt-0.5 size-5 flex-none cursor-pointer accent-l3"
        checked={done}
        onChange={onToggle}
      />
      <span
        className={`mt-px flex-none rounded-full border-[1.5px] px-2 text-xs font-semibold capitalize ${TAG_CLASS[task.type]}`}
      >
        {task.type}
      </span>
      <span className={`flex-1 ${done ? "text-mute line-through" : ""}`}>
        {task.text}
      </span>
      <span className="text-[13px] whitespace-nowrap text-mute">
        {task.minutes} min
      </span>
    </label>
  );
}

// Edit mode: type, text and minutes become editable, plus a delete button.
export function TaskEditRow({
  task,
  editor,
}: {
  task: Task;
  editor: PlanEditor;
}) {
  const save = (input: UpdateTaskInput) =>
    editor.updateTask.mutate({ taskId: task.id, input });

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_80px_auto] items-center gap-2 py-1 sm:grid-cols-[110px_minmax(0,1fr)_80px_auto]">
      <select
        value={task.type}
        onChange={(e) => save({ type: e.target.value as Task["type"] })}
        aria-label="Task type"
        className={`${FIELD} col-span-full capitalize sm:col-span-1`}
      >
        {TASK_TYPES.map((type) => (
          <option key={type} value={type}>
            {type}
          </option>
        ))}
      </select>
      <EditableText
        value={task.text}
        onSave={(text) => save({ text })}
        aria-label="Task text"
        className={FIELD}
      />
      <EditableText
        value={String(task.minutes)}
        isValid={(value) => /^\d{1,4}$/.test(value) && Number(value) <= 1440}
        onSave={(value) => save({ minutes: Number(value) })}
        inputMode="numeric"
        aria-label="Minutes"
        className={FIELD}
      />
      <ConfirmButton
        label={`Delete task ${task.text}`}
        onConfirm={() => editor.deleteTask.mutate(task.id)}
      >
        Delete
      </ConfirmButton>
    </div>
  );
}
