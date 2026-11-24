import { describe, expect, it } from "vitest";
import request from "supertest";
import { app, createPlanFor, createUserAgent } from "./helpers";

describe("plans", () => {
  it("creates a plan with phases and lists it", async () => {
    const alice = await createUserAgent("alice@test.dev");

    const created = await alice.post("/plans", {
      title: "  My sprint  ",
      startDate: "2026-11-24",
      phases: ["Backend", "Frontend"],
    });
    expect(created.status).toBe(201);
    expect(created.body.title).toBe("My sprint"); // trimmed by Zod
    expect(created.body.phases.map((p: { name: string }) => p.name)).toEqual([
      "Backend",
      "Frontend",
    ]);

    const list = await alice.get("/plans");
    expect(list.status).toBe(200);
    expect(list.body).toHaveLength(1);
  });

  it("returns the full plan with days and tasks in order", async () => {
    const alice = await createUserAgent("alice@test.dev");
    const plan = await createPlanFor(alice);

    const day = await alice.post(`/plans/${plan.id}/days`, { title: "Day 1" });
    await alice.post(`/days/${day.body.id}/tasks`, {
      type: "learn",
      text: "First",
      minutes: 30,
    });
    await alice.post(`/days/${day.body.id}/tasks`, {
      type: "build",
      text: "Second",
      minutes: 60,
    });

    const res = await alice.get(`/plans/${plan.id}`);
    expect(res.status).toBe(200);
    expect(res.body.days).toHaveLength(1);
    expect(res.body.days[0].tasks.map((t: { text: string }) => t.text)).toEqual(
      ["First", "Second"],
    );
  });

  it("rejects invalid input with 400", async () => {
    const alice = await createUserAgent("alice@test.dev");
    const res = await alice.post("/plans", { title: "", startDate: "soon" });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("rejects an empty update with 400", async () => {
    const alice = await createUserAgent("alice@test.dev");
    const plan = await createPlanFor(alice);
    const res = await alice.patch(`/plans/${plan.id}`, {});
    expect(res.status).toBe(400);
  });

  it("updates a plan", async () => {
    const alice = await createUserAgent("alice@test.dev");
    const plan = await createPlanFor(alice);
    const res = await alice.patch(`/plans/${plan.id}`, { title: "Renamed" });
    expect(res.status).toBe(200);
    expect(res.body.title).toBe("Renamed");
  });

  it("hides other users' plans (404, not 403)", async () => {
    const alice = await createUserAgent("alice@test.dev");
    const bob = await createUserAgent("bob@test.dev");
    const plan = await createPlanFor(alice);

    expect((await bob.get(`/plans/${plan.id}`)).status).toBe(404);
    expect(
      (await bob.patch(`/plans/${plan.id}`, { title: "Hacked" })).status,
    ).toBe(404);
    expect((await bob.get("/plans")).body).toEqual([]);
  });

  it("requires a user", async () => {
    const res = await request(app).get("/plans");
    expect(res.status).toBe(401);
  });
});
