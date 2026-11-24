import type { planStats } from "../lib/progress";

type Stats = ReturnType<typeof planStats>;

// The 6-cell stats strip under the header, same as the prototype.
export function StatsRow({ stats }: { stats: Stats }) {
  const cells = [
    {
      value: `${stats.daysDone}/${stats.dayCount}`,
      label: "Days done",
      ...frac(stats.daysDone, stats.dayCount),
    },
    {
      value: `${stats.learn.done}/${stats.learn.total}`,
      label: "Learn",
      ...frac(stats.learn.done, stats.learn.total),
    },
    {
      value: `${stats.practice.done}/${stats.practice.total}`,
      label: "Practice",
      ...frac(stats.practice.done, stats.practice.total),
    },
    {
      value: `${stats.build.done}/${stats.build.total}`,
      label: "Build",
      ...frac(stats.build.done, stats.build.total),
    },
    {
      value: `${stats.hoursDone}h`,
      label: `of ${stats.hoursTotal}h planned`,
      ...frac(stats.hoursDone, stats.hoursTotal),
    },
    { value: String(stats.streak), label: "day streak", pct: null },
  ];

  return (
    <div className="mt-6 grid grid-cols-3 gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-6">
      {cells.map((cell) => (
        <div key={cell.label} className="bg-bg px-4 py-3.5">
          <b className="block text-[clamp(22px,3vw,30px)] leading-tight font-extrabold whitespace-nowrap">
            {cell.value}
          </b>
          <span className="text-[13px] text-mute">{cell.label}</span>
          {cell.pct !== null && <ProgressBar pct={cell.pct} />}
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

const frac = (done: number, total: number) => ({
  pct: total ? Math.round((done / total) * 100) : 0,
});
