import { describe, expect, it } from "vitest";
import request from "supertest";
import { eq } from "drizzle-orm";
import { db } from "../src/db/client";
import { sessions, users } from "../src/db/schema";
import { app, createUserAgent, TEST_PASSWORD } from "./helpers";

const sessionCookie = (res: request.Response) =>
  ([] as string[])
    .concat(res.headers["set-cookie"] ?? [])
    .find((c) => c.startsWith("sid="));

describe("auth", () => {
  it("registers, sets a secure-by-default cookie, and starts with the sample plan", async () => {
    const res = await request(app)
      .post("/auth/register")
      .send({ email: "  Alice@Test.DEV ", password: TEST_PASSWORD });

    expect(res.status).toBe(201);
    expect(res.body.email).toBe("alice@test.dev"); // trimmed + lowercased
    expect(res.body).not.toHaveProperty("passwordHash");

    const cookie = sessionCookie(res);
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Lax/i);

    const plans = await request(app).get("/plans").set("Cookie", cookie!);
    expect(plans.body).toHaveLength(1);
    expect(plans.body[0].title).toBe("60-Day Full-Stack Sprint");
  });

  it("stores an Argon2id hash, never the password", async () => {
    await createUserAgent("alice@test.dev");
    const [row] = await db
      .select()
      .from(users)
      .where(eq(users.email, "alice@test.dev"));
    expect(row?.passwordHash).toMatch(/^\$argon2id\$/);
    expect(row?.passwordHash).not.toContain(TEST_PASSWORD);
  });

  it("stores only a hash of the session token", async () => {
    const res = await request(app)
      .post("/auth/register")
      .send({ email: "alice@test.dev", password: TEST_PASSWORD });
    const token = sessionCookie(res)!.split(";")[0]!.slice("sid=".length);
    const [row] = await db.select().from(sessions);
    expect(row?.id).toMatch(/^[0-9a-f]{64}$/); // SHA-256 hex
    expect(row?.id).not.toBe(token);
  });

  it("refuses a duplicate email with 409", async () => {
    await createUserAgent("alice@test.dev");
    const res = await request(app)
      .post("/auth/register")
      .send({ email: "ALICE@test.dev", password: "another password" });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("EMAIL_TAKEN");
  });

  it("refuses a short password", async () => {
    const res = await request(app)
      .post("/auth/register")
      .send({ email: "alice@test.dev", password: "short" });
    expect(res.status).toBe(400);
  });

  it("logs in with the right password, and /me says who you are", async () => {
    await createUserAgent("alice@test.dev");
    const agent = request.agent(app);
    const login = await agent
      .post("/auth/login")
      .send({ email: "alice@test.dev", password: TEST_PASSWORD });
    expect(login.status).toBe(200);

    const me = await agent.get("/me");
    expect(me.status).toBe(200);
    expect(me.body.email).toBe("alice@test.dev");
  });

  it("gives the same answer for a wrong password and an unknown email", async () => {
    await createUserAgent("alice@test.dev");
    const wrongPassword = await request(app)
      .post("/auth/login")
      .send({ email: "alice@test.dev", password: "not the password" });
    const unknownEmail = await request(app)
      .post("/auth/login")
      .send({ email: "nobody@test.dev", password: TEST_PASSWORD });

    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    expect(wrongPassword.body).toEqual(unknownEmail.body);
    expect(sessionCookie(wrongPassword)).toBeUndefined();
  });

  it("logs out: the old cookie stops working, even if someone kept a copy", async () => {
    const alice = await createUserAgent("alice@test.dev");
    const stolenCopy = await request(app)
      .post("/auth/login")
      .send({ email: "alice@test.dev", password: TEST_PASSWORD })
      .then(sessionCookie);

    // Log out the session that "stolenCopy" belongs to
    const out = await request(app)
      .post("/auth/logout")
      .set("Cookie", stolenCopy!);
    expect(out.status).toBe(204);

    expect(
      (await request(app).get("/me").set("Cookie", stolenCopy!)).status,
    ).toBe(401);
    // Alice's other session (another device) is unaffected
    expect((await alice.get("/me")).status).toBe(200);
  });

  it("rejects requests with no cookie or a made-up cookie", async () => {
    expect((await request(app).get("/me")).status).toBe(401);
    expect(
      (await request(app).get("/plans").set("Cookie", "sid=made-up-token"))
        .status,
    ).toBe(401);
  });

  it("rejects an expired session", async () => {
    const alice = await createUserAgent("alice@test.dev");
    await db.update(sessions).set({ expiresAt: new Date(Date.now() - 1000) });
    expect((await alice.get("/me")).status).toBe(401);
    expect(await db.select().from(sessions)).toHaveLength(0); // cleaned up
  });

  it("extends a session in its second half of life (sliding expiry)", async () => {
    const alice = await createUserAgent("alice@test.dev");
    const tenDays = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
    await db.update(sessions).set({ expiresAt: tenDays });

    const res = await alice.get("/me");
    expect(res.status).toBe(200);
    expect(sessionCookie(res)).toBeDefined(); // cookie re-sent with a new expiry
    const [row] = await db.select().from(sessions);
    expect(row!.expiresAt.getTime()).toBeGreaterThan(tenDays.getTime());
  });
});
