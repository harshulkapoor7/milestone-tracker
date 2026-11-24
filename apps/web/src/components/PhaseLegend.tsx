import type { PlanDetail, PlanStats } from "@milestone/shared";
import { phaseColor } from "../lib/progress";

// "▬ Backend core · 3/15": which colour is which phase, and days done per phase.
// The counts come from the server's stats (one GROUP BY), not from JS loops.
export function PhaseLegend({
  plan,
  stats,
}: {
  plan: PlanDetail;
  stats: PlanStats | undefined;
}) {
  const counts = new Map(stats?.byPhase.map((p) => [p.phaseId, p]));
  return (
    <div className="mt-2 flex flex-wrap gap-x-5.5 gap-y-2 text-sm text-mute">
      {plan.phases.map((phase) => {
        const c = counts.get(phase.id);
        return (
          <span key={phase.id} className="inline-flex items-center gap-2">
            <i
              className="inline-block h-1.5 w-5.5 rounded-full"
              style={{ background: phaseColor(phase.position) }}
            />
            {phase.name} · {c ? `${c.daysDone}/${c.days}` : "–"}
          </span>
        );
      })}
    </div>
  );
}
