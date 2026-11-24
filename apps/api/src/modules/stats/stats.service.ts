import { sql } from "drizzle-orm";
import type { PlanStats, TaskType } from "@milestone/shared";
import { db } from "../../db/client";
import { assertPlanOwned } from "../plans/plans.service";

// All the maths happens in Postgres, close to the data: only small results
// travel to the API, instead of every task row for JavaScript to count.
// Written as raw SQL on purpose, so the queries read exactly as Postgres runs them.
// Notes:
// - count(x) counts non-null values, so count(t.done_at) = number of done tasks.
// - ::int turns Postgres's bigint counts into normal JS numbers.
// - ${...} inside sql`` becomes a $1/$2 parameter, never pasted into the text,
//   so user input can't inject SQL.

export async function getStats(
  userId: string,
  planId: string,
  tz: string,
): Promise<PlanStats> {
  await assertPlanOwned(userId, planId);

  const [byType, dayStatus, activity, streak] = await Promise.all([
    tasksByType(planId),
    daysByPhase(planId),
    activityByDate(planId, tz),
    streaks(planId, tz),
  ]);

  const sum = <T>(rows: T[], pick: (r: T) => number) =>
    rows.reduce((total, r) => total + pick(r), 0);

  return {
    totals: {
      tasks: sum(byType.rows, (r) => r.total),
      tasksDone: sum(byType.rows, (r) => r.done),
      minutes: sum(byType.rows, (r) => r.minutes),
      minutesDone: sum(byType.rows, (r) => r.minutes_done),
      days: sum(dayStatus.rows, (r) => r.days),
      daysDone: sum(dayStatus.rows, (r) => r.days_done),
    },
    byType: byType.rows.map((r) => ({
      type: r.type,
      total: r.total,
      done: r.done,
    })),
    byPhase: dayStatus.rows
      .filter((r) => r.phase_id !== null)
      .map((r) => ({
        phaseId: r.phase_id!,
        days: r.days,
        daysDone: r.days_done,
      })),
    streak: {
      current: streak.rows[0]?.current ?? 0,
      longest: streak.rows[0]?.longest ?? 0,
      activeToday: streak.rows[0]?.active_today ?? false,
    },
    activity: activity.rows.map((r) => ({
      date: r.date,
      tasksDone: r.tasks_done,
    })),
  };
}

// 1. GROUP BY: one row per task type, with totals and done counts.
function tasksByType(planId: string) {
  return db.execute<{
    type: TaskType;
    total: number;
    done: number;
    minutes: number;
    minutes_done: number;
  }>(sql`
    SELECT t.type,
           count(*)::int                                         AS total,
           count(t.done_at)::int                                 AS done,
           coalesce(sum(t.minutes), 0)::int                      AS minutes,
           coalesce(sum(t.minutes) FILTER (WHERE t.done_at IS NOT NULL), 0)::int
                                                                 AS minutes_done
    FROM tasks t
    JOIN days d ON d.id = t.day_id
    WHERE d.plan_id = ${planId}
    GROUP BY t.type
    ORDER BY t.type
  `);
}

// 2. Two levels of grouping with a CTE ("WITH" = a named sub-result):
//    first decide per DAY whether it's done (has tasks, and all are done),
//    then count days and done days per PHASE.
function daysByPhase(planId: string) {
  return db.execute<{
    phase_id: string | null;
    days: number;
    days_done: number;
  }>(sql`
    WITH day_status AS (
      SELECT d.id,
             d.phase_id,
             count(t.id) > 0 AND count(t.id) = count(t.done_at) AS is_done
      FROM days d
      LEFT JOIN tasks t ON t.day_id = d.id   -- LEFT: keep days with no tasks
      WHERE d.plan_id = ${planId}
      GROUP BY d.id
    )
    SELECT phase_id,
           count(*)::int                          AS days,
           count(*) FILTER (WHERE is_done)::int   AS days_done
    FROM day_status
    GROUP BY phase_id
  `);
}

// 3. History: how many tasks were finished on each calendar date, in the
//    user's time zone. "AT TIME ZONE" converts the stored UTC instant to local
//    wall-clock time; ::date keeps just the day. ::text avoids JS Date surprises.
function activityByDate(planId: string, tz: string) {
  return db.execute<{ date: string; tasks_done: number }>(sql`
    SELECT (t.done_at AT TIME ZONE ${tz})::date::text AS date,
           count(*)::int                               AS tasks_done
    FROM tasks t
    JOIN days d ON d.id = t.day_id
    WHERE d.plan_id = ${planId} AND t.done_at IS NOT NULL
    GROUP BY 1
    ORDER BY 1
  `);
}

// 4. Streaks with the "gaps and islands" trick (a window function):
//    Number the active dates in order with row_number(). For dates in an
//    unbroken run, date − row_number gives the SAME value, so that value
//    labels each run ("island"):
//        date        row_number   date − row_number
//        Nov 20      1            Nov 19   ┐ island A (2 days)
//        Nov 21      2            Nov 19   ┘
//        Nov 23      3            Nov 20   ┐ island B (3 days)
//        Nov 24      4            Nov 20   │
//        Nov 25      5            Nov 20   ┘
//    Then GROUP BY that label to get each run's length and last date.
//    The current streak is the run ending today or yesterday (today isn't
//    over yet, so not having done anything *yet* doesn't break it).
function streaks(planId: string, tz: string) {
  return db.execute<{
    current: number;
    longest: number;
    active_today: boolean;
  }>(sql`
    WITH active_days AS (
      SELECT DISTINCT (t.done_at AT TIME ZONE ${tz})::date AS day
      FROM tasks t
      JOIN days d ON d.id = t.day_id
      WHERE d.plan_id = ${planId} AND t.done_at IS NOT NULL
    ),
    islands AS (
      SELECT day,
             day - (row_number() OVER (ORDER BY day))::int AS island
      FROM active_days
    ),
    runs AS (
      SELECT max(day) AS last_day, count(*)::int AS length
      FROM islands
      GROUP BY island
    ),
    today AS (
      SELECT (now() AT TIME ZONE ${tz})::date AS day
    )
    SELECT coalesce(max(runs.length), 0)::int                                    AS longest,
           coalesce(max(runs.length) FILTER (WHERE runs.last_day >= today.day - 1), 0)::int
                                                                                  AS current,
           coalesce(bool_or(runs.last_day = today.day), false)                   AS active_today
    FROM today
    LEFT JOIN runs ON true
    GROUP BY today.day
  `);
}
