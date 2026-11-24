import type { PlanStats, TaskType } from "@milestone/shared";

// The 6-cell stats strip under the header, same as the prototype.
// All numbers come from the server (GET /plans/:id/stats), computed in SQL.
// While they load, cells show "–" instead of jumping around.
export function StatsRow({ stats }: { stats: PlanStats | undefined }) {
  const type = (t: TaskType) =>
    stats?.byType.find((row) => row.type === t) ?? { done: 0, total: 0 };
  const hours = (minutes: number) => Math.round(minutes / 60);

  const cells = stats
    ? [
        cell("Days done", stats.totals.daysDone, stats.totals.days),
        cell("Learn", type("learn").done, type("learn").total),
        cell("Practice", type("practice").done, type("practice").total),
        cell("Build", type("build").done, type("build").total),
        {
          value: `${hours(stats.totals.minutesDone)}h`,
          label: `of ${hours(stats.totals.minutes)}h planned`,
          pct: pct(stats.totals.minutesDone, stats.totals.minutes),
        },
        {
          value: String(stats.streak.current),
          label:
            stats.streak.longest > stats.streak.current
              ? `day streak · best ${stats.streak.longest}`
              : "day streak",
          pct: null,
          hint: stats.streak.activeToday
            ? "You've ticked something off today"
            : stats.streak.current > 0
              ? "Tick a task today to keep it going"
              : undefined,
        },
      ]
    : ["Days done", "Learn", "Practice", "Build", "Hours", "day streak"].map(
        (label) => ({ value: "–", label, pct: null, hint: undefined }),
      );

  return (
    <div className="mt-6 grid grid-cols-3 gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-6">
      {cells.map((c) => (
        <div key={c.label} className="bg-bg px-4 py-3.5" title={c.hint}>
          <b className="block text-[clamp(22px,3vw,30px)] leading-tight font-extrabold whitespace-nowrap">
            {c.value}
          </b>
          <span className="text-[13px] text-mute">{c.label}</span>
          {c.pct !== null && <ProgressBar pct={c.pct} />}
        </div>
      ))}
    </div>
  );
}

export function ProgressBar({ pct, color }: { pct: number; color?: string }) {
  return (
    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line">
      <i
        className="block h-full bg-ink"
        style={{ width: `${pct}%`, background: color }}
      />
    </div>
  );
}

const pct = (done: number, total: number) =>
  total ? Math.round((done / total) * 100) : 0;

const cell = (label: string, done: number, total: number) => ({
  value: `${done}/${total}`,
  label,
  pct: pct(done, total),
  hint: undefined as string | undefined,
});
