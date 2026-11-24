import type { PlanDetail } from "@milestone/shared";
import type { PlanEditor } from "../lib/queries";
import { EditableText } from "./EditableText";

const FIELD =
  "min-h-10 rounded-[10px] border-[1.5px] border-line bg-bg px-3 py-1.5 text-ink";

// Plan title and start date, at the foot of the page like the prototype.
export function PlanSettings({
  plan,
  editor,
}: {
  plan: PlanDetail;
  editor: PlanEditor;
}) {
  return (
    <section className="border-t border-line px-[max(5vw,16px)] py-[clamp(20px,3.5vw,48px)]">
      <div className="mx-auto max-w-[1240px]">
        <h2 className="mb-3 text-[22px] font-extrabold">Plan settings</h2>
        <div className="grid gap-x-6 sm:grid-cols-2">
          <label className="mb-3 grid gap-1 text-sm text-mute">
            Plan title
            <EditableText
              value={plan.title}
              onSave={(title) => editor.updatePlan.mutate({ title })}
              className={FIELD}
            />
          </label>
          <label className="mb-3 grid gap-1 text-sm text-mute">
            Start date (Day 1)
            <input
              type="date"
              value={plan.startDate}
              onChange={(e) => {
                if (e.target.value)
                  editor.updatePlan.mutate({ startDate: e.target.value });
              }}
              className={FIELD}
            />
          </label>
        </div>
        <p className="mt-2 text-[13px] text-mute">
          Daily rhythm: learn first, then the practice problems, then one build
          task. If a problem beats you after 30 minutes, read the solution and
          rewrite it from memory the next day.
        </p>
      </div>
    </section>
  );
}
