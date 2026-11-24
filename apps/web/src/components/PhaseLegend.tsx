import type { PlanDetail } from "@milestone/shared";
import { isDayDone, phaseColor } from "../lib/progress";

// "▬ Backend core · 3/15": which colour is which phase, and progress per phase.
export function PhaseLegend({ plan }: { plan: PlanDetail }) {
  return (
    <div className="mt-2 flex flex-wrap gap-x-5.5 gap-y-2 text-sm text-mute">
      {plan.phases.map((phase) => {
        const days = plan.days.filter((d) => d.phaseId === phase.id);
        return (
          <span key={phase.id} className="inline-flex items-center gap-2">
            <i
              className="inline-block h-1.5 w-5.5 rounded-full"
              style={{ background: phaseColor(phase.position) }}
            />
            {phase.name} · {days.filter(isDayDone).length}/{days.length}
          </span>
        );
      })}
    </div>
  );
}
