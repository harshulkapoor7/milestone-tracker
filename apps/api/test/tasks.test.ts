import { describe, expect, it } from "vitest";
import { createPlanFor, createUserAgent } from "./helpers";

async function setup() {
  const alice = await createUserAgent("alice@test.dev");
  const plan = await createPlanFor(alice);
  const day = await alice.post(`/plans/${plan.id}/days`, { title: "Day" });
  const task = await alice.post(`/days/${day.body.id}/tasks`, {
    type: "practice",
    text: "2 LeetCode problems",
    minutes: 60,
  });
  return { alice, dayId: day.body.id as string, task: task.body };
}

describe("tasks", () => {
  it("creates a task that is not done yet", async () => {
    const { task } = await setup();
    expect(task).toMatchObject({
      type: "practice",
      minutes: 60,
      position: 0,
      doneAt: null,
    });
  });

  it("marks a task done (records when) and undone (clears it)", async () => {
    const { alice, task } = await setup();

    const done = await alice.patch(`/tasks/${task.id}`, { done: true });
    expect(done.status).toBe(200);
    expect(new Date(done.body.doneAt).getTime()).toBeGreaterThan(
      Date.now() - 5000,
    );

    const undone = await alice.patch(`/tasks/${task.id}`, { done: false });
    expect(undone.body.doneAt).toBeNull();
  });

  it("rejects bad task data", async () => {
    const { alice, dayId } = await setup();
    const badType = await alice.post(`/days/${dayId}/tasks`, {
      type: "sleep",
      text: "Nap",
      minutes: 30,
    });
    const negative = await alice.post(`/days/${dayId}/tasks`, {
      type: "learn",
      text: "Time travel",
      minutes: -5,
    });
    expect(badType.status).toBe(400);
    expect(negative.status).toBe(400);
  });

  it("deletes a task", async () => {
    const { alice, task } = await setup();
    expect((await alice.delete(`/tasks/${task.id}`)).status).toBe(204);
    expect((await alice.delete(`/tasks/${task.id}`)).status).toBe(404);
  });

  it("hides other users' tasks", async () => {
    const { dayId, task } = await setup();
    const bob = await createUserAgent("bob@test.dev");

    expect(
      (
        await bob.post(`/days/${dayId}/tasks`, {
          type: "learn",
          text: "Sneaky",
          minutes: 1,
        })
      ).status,
    ).toBe(404);
    expect((await bob.patch(`/tasks/${task.id}`, { done: true })).status).toBe(
      404,
    );
    expect((await bob.delete(`/tasks/${task.id}`)).status).toBe(404);
  });

  it("rejects an id that is not a UUID", async () => {
    const { alice } = await setup();
    expect((await alice.patch("/tasks/42", { done: true })).status).toBe(400);
  });
});
