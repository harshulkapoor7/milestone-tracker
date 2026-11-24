import { describe, expect, it } from "vitest";
import { createPlanFor, createUserAgent } from "./helpers";

describe("days", () => {
  it("appends new days at the end", async () => {
    const alice = await createUserAgent("alice@test.dev");
    const plan = await createPlanFor(alice);

    const first = await alice.post(`/plans/${plan.id}/days`, { title: "One" });
    const second = await alice.post(`/plans/${plan.id}/days`, { title: "Two" });

    expect(first.status).toBe(201);
    expect(first.body.position).toBe(0);
    expect(second.body.position).toBe(1);
  });

  it("updates title, note and phase", async () => {
    const alice = await createUserAgent("alice@test.dev");
    const plan = await createPlanFor(alice);
    const day = await alice.post(`/plans/${plan.id}/days`, { title: "Day" });

    const res = await alice.patch(`/days/${day.body.id}`, {
      title: "Better title",
      note: "Went well",
      phaseId: plan.phases[1]?.id,
    });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      title: "Better title",
      note: "Went well",
      phaseId: plan.phases[1]?.id,
    });
  });

  it("refuses a phase from another plan", async () => {
    const alice = await createUserAgent("alice@test.dev");
    const planA = await createPlanFor(alice);
    const planB = await createPlanFor(alice);
    const day = await alice.post(`/plans/${planA.id}/days`, { title: "Day" });

    const res = await alice.patch(`/days/${day.body.id}`, {
      phaseId: planB.phases[0]?.id,
    });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_PHASE");
  });

  it("deletes a day together with its tasks", async () => {
    const alice = await createUserAgent("alice@test.dev");
    const plan = await createPlanFor(alice);
    const day = await alice.post(`/plans/${plan.id}/days`, { title: "Day" });
    await alice.post(`/days/${day.body.id}/tasks`, {
      type: "learn",
      text: "Task",
      minutes: 10,
    });

    expect((await alice.delete(`/days/${day.body.id}`)).status).toBe(204);
    const full = await alice.get(`/plans/${plan.id}`);
    expect(full.body.days).toEqual([]);
  });

  it("hides other users' days", async () => {
    const alice = await createUserAgent("alice@test.dev");
    const bob = await createUserAgent("bob@test.dev");
    const plan = await createPlanFor(alice);
    const day = await alice.post(`/plans/${plan.id}/days`, { title: "Day" });

    expect(
      (await bob.post(`/plans/${plan.id}/days`, { title: "Sneaky" })).status,
    ).toBe(404);
    expect(
      (await bob.patch(`/days/${day.body.id}`, { title: "Hacked" })).status,
    ).toBe(404);
    expect((await bob.delete(`/days/${day.body.id}`)).status).toBe(404);
  });
});
