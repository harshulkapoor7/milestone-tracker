import request from "supertest";
import { createApp } from "../src/app";

export const app = createApp();

export const TEST_PASSWORD = "correct horse battery";

// Registers a real user through the API and returns a Supertest *agent*:
// like a browser, it stores the session cookie from the response and sends it
// with every later request. So the tests log in exactly like a real user.
export async function createUserAgent(email: string) {
  const agent = request.agent(app);
  const res = await agent
    .post("/auth/register")
    .send({ email, password: TEST_PASSWORD });
  if (res.status !== 201) {
    throw new Error(
      `Register failed: ${res.status} ${JSON.stringify(res.body)}`,
    );
  }

  return {
    user: res.body as { id: string; email: string },
    raw: agent,
    get: (url: string) => agent.get(url),
    post: (url: string, body?: object) => agent.post(url).send(body),
    patch: (url: string, body?: object) => agent.patch(url).send(body),
    delete: (url: string) => agent.delete(url),
  };
}

// A small plan with 2 phases, ready for day/task tests.
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
