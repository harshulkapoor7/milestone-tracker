// Runs in every test file: wipe all tables before each test, close connections at the end.
import { afterAll, beforeEach } from "vitest";
import { sql } from "drizzle-orm";
import { db, pool } from "../src/db/client";

beforeEach(async () => {
  // Each test starts from an empty database, so tests can't affect each other.
  await db.execute(
    sql`truncate table users, sessions, plans, phases, days, tasks cascade`,
  );
});

afterAll(async () => {
  await pool.end();
});
