import request from "supertest";
import { createApp } from "../src/app";
import { db } from "../src/db/client";
import { users } from "../src/db/schema";

export const app = createApp();

// Creates a user straight in the database and returns a Supertest "agent"
// that sends every request as that user (via the temporary x-user-id header).
export async function createUserAgent(email: string) {
  const [user] = await db
    .insert(users)
    .values({ email, passwordHash: "!" })
    .returning();
  if (!user) throw new Error("Failed to create test user");

  const as = (req: request.Test) => req.set("x-user-id", user.id);
  return {
    user,
    get: (url: string) => as(request(app).get(url)),
    post: (url: string, body?: object) => as(request(app).post(url)).send(body),
    patch: (url: string, body?: object) =>
      as(request(app).patch(url)).send(body),
    delete: (url: string) => as(request(app).delete(url)),
  };
}

// A plan with 2 phases, ready for day/task tests.
export async function createPlanFor(
  agent: Awaited<ReturnType<typeof createUserAgent>>,
) {
  const res = await agent.post("/plans", {
    title: "Test plan",
    startDate: "2026-11-24",
    phases: ["Phase A", "Phase B"],
  });
  return res.body as {
    id: string;
    phases: { id: string; name: string }[];
  };
}
