import { describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "../src/db/client";
import { tasks } from "../src/db/schema";
import { createPlanFor, createUserAgent } from "./helpers";

type Agent = Awaited<ReturnType<typeof createUserAgent>>;
const DAY_MS = 24 * 60 * 60 * 1000;

// Noon UTC, `daysAgo` days before today: safely inside that UTC calendar day.
const noonUtc = (daysAgo: number) => {
  const d = new Date();
  d.setUTCHours(12, 0, 0, 0);
  return new Date(d.getTime() - daysAgo * DAY_MS);
};

async function addDay(agent: Agent, planId: string, phaseId: string | null) {
  const res = await agent.post(`/plans/${planId}/days`, {
    title: "Day",
    phaseId,
  });
  return res.body.id as string;
}

async function addTask(agent: Agent, dayId: string, minutes = 30) {
  const res = await agent.post(`/days/${dayId}/tasks`, {
    type: "learn",
    text: "Task",
    minutes,
  });
  return res.body.id as string;
}

// Mark a task done at an exact moment (the API would always use "now").
const doneAt = (taskId: string, when: Date) =>
  db.update(tasks).set({ doneAt: when }).where(eq(tasks.id, taskId));

// A plan with one day holding `n` tasks, all finished on the given dates.
async function planWithActivity(dates: Date[]) {
  const alice = await createUserAgent("alice@test.dev");
  const plan = await createPlanFor(alice);
  const dayId = await addDay(alice, plan.id, null);
  for (const date of dates) await doneAt(await addTask(alice, dayId), date);
  return { alice, planId: plan.id };
}

describe("stats", () => {
  it("counts tasks, minutes and days (overall, per type, per phase)", async () => {
    const alice = await createUserAgent("alice@test.dev");
    const plan = await createPlanFor(alice); // phases: Phase A, Phase B
    const [phaseA, phaseB] = plan.phases;

    const day1 = await addDay(alice, plan.id, phaseA!.id); // fully done
    await alice.patch(`/tasks/${await addTask(alice, day1, 30)}`, {
      done: true,
    });
    await alice.patch(`/tasks/${await addTask(alice, day1, 60)}`, {
      done: true,
    });
    const day2 = await addDay(alice, plan.id, phaseB!.id); // not done
    await addTask(alice, day2, 45);
    await addDay(alice, plan.id, null); // no tasks: never counts as done

    const res = await alice.get(`/plans/${plan.id}/stats?tz=UTC`);
    expect(res.status).toBe(200);
    expect(res.body.totals).toEqual({
      tasks: 3,
      tasksDone: 2,
      minutes: 135,
      minutesDone: 90,
      days: 3,
      daysDone: 1,
    });
    expect(res.body.byType).toEqual([{ type: "learn", total: 3, done: 2 }]);
    expect(res.body.byPhase).toEqual(
      expect.arrayContaining([
        { phaseId: phaseA!.id, days: 1, daysDone: 1 },
        { phaseId: phaseB!.id, days: 1, daysDone: 0 },
      ]),
    );
  });

  it("finds the current and the longest streak (gaps and islands)", async () => {
    // Active: today, 1 and 2 days ago (current run of 3)
    //         10–13 days ago (an older run of 4)
    const { alice, planId } = await planWithActivity(
      [0, 1, 2, 10, 11, 12, 13].map(noonUtc),
    );
    const res = await alice.get(`/plans/${planId}/stats?tz=UTC`);
    expect(res.body.streak).toEqual({
      current: 3,
      longest: 4,
      activeToday: true,
    });
  });

  it("keeps a streak alive until today is over", async () => {
    // Done yesterday and the day before, nothing yet today: still a 2-day streak.
    const { alice, planId } = await planWithActivity([noonUtc(1), noonUtc(2)]);
    const res = await alice.get(`/plans/${planId}/stats?tz=UTC`);
    expect(res.body.streak).toEqual({
      current: 2,
      longest: 2,
      activeToday: false,
    });
  });

  it("breaks the streak after a full missed day", async () => {
    const { alice, planId } = await planWithActivity([noonUtc(2), noonUtc(3)]);
    const res = await alice.get(`/plans/${planId}/stats?tz=UTC`);
    expect(res.body.streak.current).toBe(0);
    expect(res.body.streak.longest).toBe(2);
  });

  it("counts several tasks on one day as one streak day", async () => {
    const { alice, planId } = await planWithActivity([
      noonUtc(0),
      noonUtc(0),
      noonUtc(0),
    ]);
    const res = await alice.get(`/plans/${planId}/stats?tz=UTC`);
    expect(res.body.streak.current).toBe(1);
    expect(res.body.activity).toEqual([
      { date: noonUtc(0).toISOString().slice(0, 10), tasksDone: 3 },
    ]);
  });

  it("uses the user's time zone to decide which day a task belongs to", async () => {
    // 8 pm UTC on 24 Nov is already 1:30 am on 25 Nov in India (UTC+5:30).
    const { alice, planId } = await planWithActivity([
      new Date("2026-11-24T20:00:00Z"),
    ]);
    const utc = await alice.get(`/plans/${planId}/stats?tz=UTC`);
    const india = await alice.get(
      `/plans/${planId}/stats?tz=${encodeURIComponent("Asia/Kolkata")}`,
    );
    expect(utc.body.activity[0].date).toBe("2026-11-24");
    expect(india.body.activity[0].date).toBe("2026-11-25");
  });

  it("returns zeros for a plan with no progress", async () => {
    const alice = await createUserAgent("alice@test.dev");
    const plan = await createPlanFor(alice);
    const res = await alice.get(`/plans/${plan.id}/stats`); // tz defaults to UTC
    expect(res.status).toBe(200);
    expect(res.body.streak).toEqual({
      current: 0,
      longest: 0,
      activeToday: false,
    });
    expect(res.body.activity).toEqual([]);
  });

  it("rejects an unknown time zone, and hides other users' stats", async () => {
    const alice = await createUserAgent("alice@test.dev");
    const bob = await createUserAgent("bob@test.dev");
    const plan = await createPlanFor(alice);
    expect(
      (await alice.get(`/plans/${plan.id}/stats?tz=Mars/Base`)).status,
    ).toBe(400);
    expect((await bob.get(`/plans/${plan.id}/stats`)).status).toBe(404);
  });
});
