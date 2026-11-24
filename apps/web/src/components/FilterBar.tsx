import type { Phase } from "@milestone/shared";
import type { Filters } from "../lib/filters";
import { phaseColor } from "../lib/progress";

interface FilterBarProps {
  phases: Phase[];
  filters: Filters;
  onChange: (filters: Filters) => void;
}

// Sticky bar above the day list: phase tabs, "Hide done", and search.
export function FilterBar({ phases, filters, onChange }: FilterBarProps) {
  const set = (patch: Partial<Filters>) => onChange({ ...filters, ...patch });
  const tabs = [
    { id: "all", label: "All", color: null },
    ...phases.map((p) => ({
      id: p.id,
      label: p.name,
      color: phaseColor(p.position),
    })),
  ];

  return (
    <div className="sticky top-0 z-10 flex flex-wrap items-center gap-2 border-b border-line bg-bg py-3">
      {tabs.map((tab) => {
        const active = filters.phaseId === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            aria-pressed={active}
            onClick={() => set({ phaseId: tab.id })}
            className={`inline-flex min-h-10 cursor-pointer items-center rounded-full border-[1.5px] border-ink px-4 text-sm font-semibold ${active ? "bg-ink text-bg" : "bg-bg text-ink"}`}
          >
            {tab.color && (
              <i
                className="mr-1.75 inline-block size-2.25 rounded-full"
                style={{ background: tab.color }}
              />
            )}
            {tab.label}
          </button>
        );
      })}

      <label className="ml-1 inline-flex min-h-10 cursor-pointer items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={filters.hideDone}
          onChange={(e) => set({ hideDone: e.target.checked })}
          className="size-5 cursor-pointer accent-l3"
        />
        Hide done
      </label>

      <input
        type="search"
        value={filters.search}
        onChange={(e) => set({ search: e.target.value })}
        placeholder="Search days and tasks"
        aria-label="Search"
        className="min-h-10 flex-[1_1_180px] rounded-[10px] border-[1.5px] border-line bg-bg px-3 sm:ml-auto sm:max-w-75"
      />
    </div>
  );
}
