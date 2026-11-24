import type { PlanDetail } from "@milestone/shared";
import { isDayDone, phaseColor } from "../lib/progress";
import { useElementWidth } from "../lib/useElementWidth";

const HEIGHT = 300;

interface MetroMapProps {
  plan: PlanDetail;
  today: number; // index of today's day
  onSelectDay: (index: number) => void;
}

// Each phase is a metro line (one row); each day is a station.
// Rows snake: left→right, then right→left, joined by a bend at the edge.
export function MetroMap({ plan, today, onSelectDay }: MetroMapProps) {
  const [ref, width] = useElementWidth<HTMLDivElement>();

  const rows = [...plan.phases]
    .sort((a, b) => a.position - b.position)
    .map((phase) => ({
      phase,
      days: plan.days
        .map((day, index) => ({ day, index }))
        .filter(({ day }) => day.phaseId === phase.id),
    }))
    .filter((row) => row.days.length > 0);

  const small = width < 520;
  const margin = small ? 30 : 46; // space at the left/right edges
  const radius = small ? 5 : 7; // station size
  const lineWidth = small ? 5 : 7;
  const rowHeight = rows.length ? HEIGHT / rows.length : HEIGHT;
  const bend = Math.min(rowHeight / 2, margin - 8); // size of the diagonal at each turn

  return (
    <div ref={ref} className="relative mt-5" style={{ height: HEIGHT }}>
      {width > 0 && (
        <svg
          width={width}
          height={HEIGHT}
          role="img"
          aria-label="Line map of the plan; each station is a day"
          className="absolute inset-0"
        >
          {rows.map((row, r) => {
            const y = rowHeight * (r + 0.5);
            const leftToRight = r % 2 === 0;
            const n = row.days.length;
            const color = phaseColor(row.phase.position);

            // Spread the stations evenly across the row.
            const xs = row.days.map((_, k) => {
              const t = n > 1 ? k / (n - 1) : 0.5;
              return leftToRight
                ? margin + t * (width - 2 * margin)
                : width - margin - t * (width - 2 * margin);
            });

            // The track: a straight line, plus a bend down to the next row.
            let path = `M${xs[0]},${y} L${xs[n - 1]},${y}`;
            if (r < rows.length - 1) {
              const edge = leftToRight ? width - margin : margin;
              const out = leftToRight ? bend : -bend;
              path += ` L${edge},${y} L${edge + out},${y + bend} L${edge + out},${y + rowHeight - bend} L${edge},${y + rowHeight}`;
            }

            return (
              <g key={row.phase.id}>
                <path
                  d={path}
                  fill="none"
                  stroke={color}
                  strokeWidth={lineWidth}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
                {row.days.map(({ day, index }, k) => {
                  const x = xs[k] ?? 0;
                  const done = isDayDone(day);
                  const isToday = index === today;
                  const isEnd = k === 0 || k === n - 1;
                  return (
                    <g key={day.id}>
                      <circle
                        cx={x}
                        cy={y}
                        r={isToday ? radius + 4 : radius}
                        fill={done ? color : "var(--color-bg)"}
                        stroke={
                          isToday
                            ? "var(--color-ink)"
                            : done
                              ? "var(--color-bg)"
                              : color
                        }
                        strokeWidth={isToday ? 4 : 3}
                        className={`cursor-pointer ${isToday ? "station-today" : ""}`}
                        onClick={() => onSelectDay(index)}
                      >
                        <title>
                          Day {index + 1}: {day.title}
                          {done ? " (done)" : ""}
                        </title>
                      </circle>
                      {(isToday || isEnd) && (
                        <text
                          x={
                            isToday ? Math.min(Math.max(x, 40), width - 40) : x
                          }
                          y={isToday ? y - radius - 12 : y + radius + 16}
                          textAnchor="middle"
                          fontSize={isToday ? 13 : 12}
                          fontWeight={isToday ? 800 : 400}
                          fill={
                            isToday ? "var(--color-ink)" : "var(--color-mute)"
                          }
                          stroke="var(--color-bg)"
                          strokeWidth={isToday ? 4 : 3}
                          paintOrder="stroke"
                          className="pointer-events-none"
                        >
                          {isToday ? `Day ${index + 1}` : index + 1}
                        </text>
                      )}
                    </g>
                  );
                })}
              </g>
            );
          })}
        </svg>
      )}
    </div>
  );
}
